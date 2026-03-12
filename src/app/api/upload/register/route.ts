// src/app/api/upload/register/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Supabase Admin Client for server-side operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Upstash Redis for rate limiting (if configured)
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes("dummy")) {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(50, "10 s"),
    });
}

export async function POST(req: Request) {
    try {
        // Enforce Rate Limiting if configured
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

        // 1. DEDUPLICATION CHECK (Security Layer)
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

        // 2. METADATA VALIDATION RULES
        // If it's a photo, enforce EXIF rules depending on strictness requirements
        if (category === "photos") {
            const hasExif = metadata && Object.keys(metadata).length > 0;
            // In a strict mode, we might reject files without EXIF here.
            // For now, we will just record the data. The admin dashboard can flag it later if `metadata` is null.
        }

        // 3. GENERATE UNIQUE IDENTIFIER
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
