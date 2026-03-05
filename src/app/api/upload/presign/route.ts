import { NextRequest, NextResponse } from "next/server";
import { generateR2PresignedUrl } from "@/utils/r2";
import { createClient } from "@/utils/supabase/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isBackendEnabled = process.env.NEXT_PUBLIC_ENABLE_BACKEND === 'true';
const hasUpstashConfig = process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes("dummy");

const ratelimit = (isBackendEnabled && hasUpstashConfig) ? new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
}) : null;

export async function POST(request: NextRequest) {
    try {
        // 1. GOD MODE CHECK #1: If backend is disabled entirely, pretend to succeed with no DB tracking.
        if (process.env.NEXT_PUBLIC_ENABLE_BACKEND !== 'true') {
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

        if (!fileName || !contentType) {
            return NextResponse.json(
                { error: "Missing required file metadata" },
                { status: 400 }
            );
        }

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

        if (fileSize > 10 * 1024 * 1024 * 1024) {
            return NextResponse.json({ error: "File exceeds 10GB maximum size" }, { status: 400 });
        }

        const sanitizedName = fileName
            .replace(/\.\./g, '')
            .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
            .substring(0, 255);

        // 4. GENERATE URL: 
        const uniqueFileName = `${user.id}/${Date.now()}-${sanitizedName.replace(/\s+/g, "_")}`;

        // HYBRID MODE CHECK: If we want real users but fake storage
        if (process.env.NEXT_PUBLIC_MOCK_STORAGE_ONLY === 'true') {
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
