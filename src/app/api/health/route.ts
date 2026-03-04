import { createClient } from '@/utils/supabase/server';

export async function GET() {
    const checks: Record<string, string> = { status: 'ok' };

    try {
        const supabase = await createClient();
        await supabase.from('profiles').select('id').limit(1);
        checks.database = 'ok';
    } catch {
        checks.database = 'error';
        checks.status = 'degraded';
    }

    const statusCode = checks.status === 'ok' ? 200 : 503;
    return Response.json({
        ...checks,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? 'unknown'
    }, { status: statusCode });
}
