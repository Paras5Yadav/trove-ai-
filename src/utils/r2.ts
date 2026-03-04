import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Using the standard AWS S3 SDK to connect to Cloudflare R2
let _r2Client: S3Client | null = null;
export function getR2Client(): S3Client {
    if (!_r2Client) {
        _r2Client = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
        });
    }
    return _r2Client;
}

export async function generateR2PresignedUrl(fileName: string, contentType: string) {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            ContentType: contentType,
        })

        const r2Client = getR2Client();
        // URL is valid for 15 minutes (tightened from 1 hour)
        const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 })
        return { signedUrl, error: null }
    } catch (error) {
        console.error("Error generating presigned URL:", error instanceof Error ? error.message : "Unknown")
        return { signedUrl: null, error: "Failed to generate upload URL" }
    }
}
