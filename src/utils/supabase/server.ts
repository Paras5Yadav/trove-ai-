import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch (error) {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                        if (process.env.NODE_ENV === 'development') {
                            console.warn('Supabase cookie set failed:',
                                error instanceof Error ? error.message : 'Unknown');
                        }
                    }
                },
            },
        }
    )
}

/**
 * Admin client that bypasses RLS policies entirely.
 * MUST ONLY BE USED IN SECURE SERVER ACTIONS AFTER VALIDATION!
 */
export async function createServiceClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use the service role key
        {
            cookies: {
                getAll() {
                    return []
                },
                setAll() {
                    // Do nothing for service client
                },
            },
        }
    )
}
