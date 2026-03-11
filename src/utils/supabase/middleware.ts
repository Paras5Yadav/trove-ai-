import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with cross-site tracking.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAdminRoute = request.nextUrl.pathname.startsWith('/mac-sam-0005')
    const isVaultRoute = request.nextUrl.pathname.startsWith('/dashboard')
    const isProtectedRoute = isAdminRoute || isVaultRoute

    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        url.searchParams.set('message', 'signin_required')
        return NextResponse.redirect(url)
    }

    // Admin access is checked on the page level by checkAdminAccess()
    // which supports both email-based and role-based access

    // If user is already logged in, redirect them away from auth screens
    const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')

    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
