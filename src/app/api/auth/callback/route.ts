import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const rawNext = searchParams.get('next') ?? '/dashboard';

    // Prevent open redirect: must start with / and not be protocol-relative (//)
    const safePath = rawNext.startsWith('/') && !rawNext.startsWith('//')
        ? rawNext
        : '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${safePath}`);
        }
    }

    return NextResponse.redirect(`${origin}/auth/error`);
}
