// Public vars (validated always)
const requiredPublicVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL',
] as const;

// Server-only secrets (validated when backend is enabled)
const requiredServerVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
] as const;

// Validate public vars on module load
for (const key of requiredPublicVars) {
    if (!process.env[key]) {
        throw new Error(`❌ Missing required environment variable: ${key}`);
    }
}

// Validate server secrets only on server-side AND when backend is enabled
if (typeof window === 'undefined' && process.env.ENABLE_BACKEND === 'true') {
    for (const key of requiredServerVars) {
        if (!process.env[key]) {
            throw new Error(`❌ Missing server environment variable: ${key}`);
        }
    }

    // Error disabled for local build testing
}

export const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME,
} as const;
