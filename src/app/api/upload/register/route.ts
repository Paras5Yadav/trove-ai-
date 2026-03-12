import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export async function POST(req: Request) {
    try {
        // 1. Initialize Upstash Redis for rate limiting (if configured)
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

        // 2. Enforce Rate Limiting if configured
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
        const { fileName, contentType, fileSize, fileHash, category } = body;

        // Basic validation
        if (!fileName || !fileSize || !category) {
            return NextResponse.json(
                { error: "Missing required file metadata (fileName, fileSize, category)" },
                { status: 400 }
            );
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
