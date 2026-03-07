import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const rawNext = searchParams.get('next') ?? '/dashboard';
    const referralCode = searchParams.get('ref');

    // Prevent open redirect: must start with / and not be protocol-relative (//)
    const safePath = rawNext.startsWith('/') && !rawNext.startsWith('//')
        ? rawNext
        : '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Create/update profile for OAuth users (Google, X, etc.)
            // Without this, the user won't appear in admin UI and uploads will fail
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                let referredByUserId = null;
                
                // If they have a referral code, look up the referrer
                if (referralCode) {
                    const { data: referrer } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('referral_code', referralCode)
                        .single();
                        
                    if (referrer) {
                        referredByUserId = referrer.id;
                    }
                }

                const displayName =
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split('@')[0] ||
                    'User';

                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', user.id)
                    .single();

                if (!existingProfile) {
                    await supabase
                        .from('profiles')
                        .insert({
                            id: user.id,
                            email: user.email,
                            display_name: displayName,
                            account_type: 'standard',
                            total_gbs_uploaded: 0,
                            calculated_earnings: 0,
                            ...(referredByUserId ? { referred_by_user_id: referredByUserId } : {})
                        });
                }
            }

            return NextResponse.redirect(`${origin}${safePath}`);
        }
    }

    return NextResponse.redirect(`${origin}/auth/error`);
}
