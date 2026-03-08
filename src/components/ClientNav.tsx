"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

export function ClientNav({ isLoggedIn }: { isLoggedIn: boolean }) {
    const pathname = usePathname();

    const isHome = pathname === "/";
    const isDashboard = pathname?.startsWith("/dashboard");

    return (
        <nav className="flex items-center gap-6 text-sm font-medium tracking-wide uppercase opacity-60 pointer-events-auto">
            {!isHome && (
                <Link href="/" className="hover:opacity-100 transition-opacity">
                    Home
                </Link>
            )}

            {!isDashboard && isLoggedIn && (
                <Link href="/dashboard" className="hover:opacity-100 transition-opacity">
                    Dashboard
                </Link>
            )}

            {isLoggedIn ? (
                isDashboard && (
                    <form action={signOutAction}>
                        <button
                            type="submit"
                            className="hover:opacity-100 transition-opacity text-red-500/80 hover:text-red-500"
                        >
                            Sign Out
                        </button>
                    </form>
                )
            ) : (
                <Link
                    href="/login"
                    className="hover:opacity-100 transition-opacity bg-gradz-charcoal text-gradz-cream px-4 py-2 rounded-full text-xs"
                >
                    Sign In
                </Link>
            )}
        </nav>
    );
}
