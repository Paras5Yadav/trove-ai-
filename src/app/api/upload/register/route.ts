import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { createServiceClient } from "@/utils/supabase/server";
import { godModeConfig } from "@/config/god-mode";

export async function POST(req: Request) {
    try {
        // 1. Initialize Supabase Admin Client for server-side operations
        // Moved inside POST to prevent build-time failures if env vars are missing
        const supabaseAdmin = await createServiceClient();

        // 2. Initialize Upstash Redis for rate limiting (if configured)
        let ratelimit: Ratelimit | null = null;
        if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes("dummy")) {
            try {
                const redis = new Redis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
                });

                ratelimit = new Ratelimit({
                    redis: redis,
                    limiter: Ratelimit.slidingWindow(50, "10 s"),
                });
            } catch (redisErr) {
                console.warn("Failed to initialize Redis for rate limiting:", redisErr);
            }
        }

        // 3. Enforce Rate Limiting if configured
        if (ratelimit) {
            try {
                const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
                const { success } = await ratelimit.limit(`register_${ip}`);
                if (!success) {
                    return NextResponse.json(
                        { error: "Too many upload attempts. Please wait." },
                        { status: 429 }
                    );
                }
            } catch (rateLimitErr) {
                console.warn("Rate limiting unavailable, bypassing:", rateLimitErr);
            }
        }

        const body = await req.json();
        const { fileName, contentType, fileSize, fileHash, category, metadata } = body;

        // Basic validation
        if (!fileName || !fileSize || !fileHash || !category) {
            return NextResponse.json(
                { error: "Missing required file metadata (fileName, fileSize, fileHash, category)" },
                { status: 400 }
            );
        }

        // 4. DEDUPLICATION CHECK (Security Layer)
        // Skip if God Mode bypass is active
        if (!godModeConfig.bypassSecurityVerification) {
            // Ensure this exact file hash hasn't been uploaded before
            const { data: existingFile, error: duplicateError } = await supabaseAdmin
                .from("files")
                .select("id")
                .eq("file_hash", fileHash)
                .single();

            if (existingFile) {
                return NextResponse.json(
                    { error: "Duplicate File Detected: This data block has already been contributed to the network." },
                    { status: 409 }
                );
            }

            if (duplicateError && duplicateError.code !== 'PGRST116') {
                console.error("Duplicate check error:", duplicateError);
                return NextResponse.json({ error: `Database Error (${duplicateError.code}): ${duplicateError.message}` }, { status: 500 });
            }
        } else {
            console.log("🛠️ God Mode: Skipping deduplication check.");
        }

        // 5. METADATA VALIDATION RULES
        // If it's a photo, enforce EXIF rules depending on strictness requirements
        if (category === "photos") {
            // const hasExif = metadata && Object.keys(metadata).length > 0;
            // For now, we record whatever we get, admin can review.
        }

        // 6. GENERATE UNIQUE IDENTIFIER
        const timestamp = Date.now();
        const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;

        // Return success with the unique filename, the UI will call vault.ts to finalize Ledger entry
        return NextResponse.json({ 
            success: true, 
            uniqueFileName,
            message: "Metadata verified successfully."
        });

    } catch (error: any) {
        console.error("API Error during metadata registration:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
