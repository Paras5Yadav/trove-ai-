/**
 * Content Authenticity Utilities
 * 
 * EXIF validation + Perceptual Hashing (pHash)
 * Runs entirely in the browser — no server/storage needed.
 * 
 * Controlled by NEXT_PUBLIC_ENABLE_AUTHENTICITY in .env.local
 */

import exifr from "exifr";
import { bmvbhash } from "blockhash-core";

// ── Rejection reasons shown directly to the user ──────────────────────
export interface AuthenticityResult {
    valid: boolean;
    reason?: string;          // Human-readable rejection reason
    duplicateHash?: string;   // pHash hex string (only when valid)
}

// Known non-camera software tags that indicate downloads / edits
const BLOCKED_SOFTWARE = [
    "whatsapp",
    "instagram",
    "snapchat",
    "telegram",
    "facebook",
    "photoshop",
    "lightroom",
    "canva",
    "picsart",
    "snapseed",
    "vsco",
    "midjourney",
    "dall-e",
    "stable diffusion",
    "adobe",
];

// Known filename patterns from social media apps and downloads
const BLOCKED_FILENAME_PATTERNS = [
    "whatsapp",
    "instagram",
    "snapchat",
    "telegram",
    "facebook",
    "img_from_",
    "received_",
    "signal-",
];

// ── Step 1: EXIF & Filename Validation ────────────────────────────────
async function validateExif(file: File): Promise<AuthenticityResult> {
    try {
        // ── Check 0: Filename patterns (works for ALL files — images, videos, etc.) ──
        const nameLower = file.name.toLowerCase();
        for (const pattern of BLOCKED_FILENAME_PATTERNS) {
            if (nameLower.includes(pattern)) {
                return {
                    valid: false,
                    reason: `File "${file.name}" appears to be from a third-party app or screen recording. Only original camera files are accepted.`,
                };
            }
        }

        // For non-image files (videos, documents), filename check is the only gate
        if (!file.type.startsWith("image/")) {
            return { valid: true };
        }

        const exifData = await exifr.parse(file, {
            // Request the specific tags we care about
            pick: ["Make", "Model", "Software", "DateTimeOriginal"],
        });

        // ── Check 1: No EXIF at all → downloaded or screenshot ────────
        if (!exifData) {
            return {
                valid: false,
                reason: "No camera metadata found. This image appears to be a screenshot or downloaded from the internet.",
            };
        }

        // ── Check 2: Missing camera hardware signatures ───────────────
        if (!exifData.Make && !exifData.Model) {
            return {
                valid: false,
                reason: "Missing camera hardware signatures (Make/Model). Only original camera photos are accepted.",
            };
        }

        // ── Check 3: Edited or forwarded via social media ─────────────
        if (exifData.Software) {
            const sw = exifData.Software.toLowerCase();
            for (const blocked of BLOCKED_SOFTWARE) {
                if (sw.includes(blocked)) {
                    return {
                        valid: false,
                        reason: `Image was processed by "${exifData.Software}". Only unedited, original photos are accepted.`,
                    };
                }
            }
        }

        return { valid: true };
    } catch {
        // If the parser crashes (corrupt file, unsupported format), let it through
        // rather than blocking legitimate uploads.
        return { valid: true };
    }
}

// ── Step 2: Perceptual Hash Generation ────────────────────────────────
// Draws the image to an off-screen canvas and generates a 16-bit pHash.
async function generatePerceptualHash(file: File): Promise<string | null> {
    try {
        // Only hash images
        if (!file.type.startsWith("image/")) {
            return null;
        }

        const bitmap = await createImageBitmap(file);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // bmvbhash returns a hex string. 16 bits = 256-bit hash (good balance of speed vs accuracy)
        const hash = bmvbhash(imageData, 16);
        return hash;
    } catch {
        return null;
    }
}

// ── Public API: Full Authenticity Check ───────────────────────────────
export async function validateFileAuthenticity(file: File): Promise<AuthenticityResult> {
    // Step 1: EXIF validation
    const exifResult = await validateExif(file);
    if (!exifResult.valid) {
        return exifResult;
    }

    // Step 2: Generate pHash for duplicate detection
    const hash = await generatePerceptualHash(file);

    return {
        valid: true,
        duplicateHash: hash ?? undefined,
    };
}
