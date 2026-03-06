import { NextRequest, NextResponse } from "next/server";
import { generateR2PresignedUrl } from "@/utils/r2";
import { createClient } from "@/utils/supabase/server";
import { godModeConfig } from "@/config/god-mode";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isBackendEnabled = process.env.ENABLE_BACKEND === 'true';
const hasUpstashConfig = process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes("dummy");

const ratelimit = (isBackendEnabled && hasUpstashConfig) ? new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
}) : null;

export async function POST(request: NextRequest) {
    try {
        // 1. GOD MODE CHECK #1: If backend is disabled entirely, pretend to succeed with no DB tracking.
        if (process.env.ENABLE_BACKEND !== 'true') {
            return NextResponse.json({
                success: true,
                url: "mock-url-//no-backend-enabled",
                isValidationMock: true
            });
        }

        // 2. BACKEND ENABLED: Verify the user is actually logged in.
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in to upload data." },
                { status: 401 }
            );
        }

        // 3. SECURE FILE CREATION: Get the file data the frontend wants to upload
        const body = await request.json();
        const { fileName, contentType, fileSize } = body;

        const identifier = user.id;
        if (ratelimit) {
            const { success: rateLimitSuccess } = await ratelimit.limit(identifier);
            if (!rateLimitSuccess) {
                return NextResponse.json({ error: "Too many upload requests. Please wait a minute." }, { status: 429 });
            }
        }

        if (!fileName || !contentType || fileSize === undefined || fileSize === null) {
            return NextResponse.json(
                { error: "Missing required fields: fileName, contentType, fileSize" },
                { status: 400 }
            );
        }

        if (fileSize <= 0) {
            return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
        }

        if (fileSize > 2 * 1024 * 1024 * 1024) {
            return NextResponse.json({ error: "File exceeds 2GB maximum size" }, { status: 400 });
        }



        // ============================================================
        // SECURITY FIX: Server-side 10GB capacity limit PER BATCH
        // Resets to 0 when a new batch is created in god-mode.ts.
        // ============================================================
        const TEN_GB_IN_BYTES = 10 * 1024 * 1024 * 1024;
        const currentBatchName = godModeConfig.currentBatch.id; // e.g. "BATCH_A204"

        // Find the current batch ID in the database
        const { data: batchData } = await supabase
            .from('batches')
            .select('id')
            .eq('name', currentBatchName)
            .single();

        if (batchData) {
            // Sum all file sizes this user uploaded in the current batch
            const { data: batchFiles, error: capErr } = await supabase
                .from('files')
                .select('file_size')
                .eq('user_id', user.id)
                .eq('batch_id', batchData.id);

            if (!capErr && batchFiles) {
                const batchTotal = batchFiles.reduce((sum, f) => sum + (f.file_size || 0), 0);
                if (batchTotal + fileSize > TEN_GB_IN_BYTES) {
                    return NextResponse.json(
                        { error: "You have reached your 10GB upload limit for this batch. Your limit will reset when a new batch begins." },
                        { status: 400 }
                    );
                }
            }
        }

        const sanitizedName = fileName
            .replace(/\.\./g, '')
            .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
            .substring(0, 255);

        // 4. GENERATE URL: 
        const uniqueFileName = `${user.id}/${Date.now()}-${sanitizedName.replace(/\s+/g, "_")}`;

        // HYBRID MODE CHECK: If we want real users but fake storage
        if (process.env.MOCK_STORAGE_ONLY === 'true') {
            return NextResponse.json({
                success: true,
                url: "mock-url-//mock-storage-only", // The frontend won't actually hit this
                uniqueFileName,
                isValidationMock: true // Tells frontend to run fake progress bar
            });
        }

        // REAL CLOUDFLARE MODE
        const { signedUrl, error } = await generateR2PresignedUrl(uniqueFileName, contentType);

        if (error || !signedUrl) {
            return NextResponse.json(
                { error: "Failed to generate secure upload url" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: signedUrl,
            uniqueFileName,
            isValidationMock: false
        });

    } catch (error: unknown) {
        console.error("Presign API Error:", error instanceof Error ? error.message : "Unknown");
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
