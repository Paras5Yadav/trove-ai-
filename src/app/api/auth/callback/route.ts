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
            // Create a profile row for OAuth users (upsert to avoid duplicates)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                        account_type: 'standard',
                        total_gbs_uploaded: 0,
                        calculated_earnings: 0
                    }, { onConflict: 'id' });
            }
            return NextResponse.redirect(`${origin}${safePath}`);
        }
    }

    return NextResponse.redirect(`${origin}/auth/error`);
}
