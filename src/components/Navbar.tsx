import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOutAction } from "@/app/actions/auth";
import { VaultLogo } from "@/components/icons/VaultLogo";

export async function Navbar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between pointer-events-none">
            <div className="text-xl font-bold tracking-tighter opacity-80 pointer-events-auto flex items-center gap-2">
                <VaultLogo className="w-6 h-6 text-moss" />
                <Link href="/">TROVE</Link>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium tracking-wide uppercase opacity-60 pointer-events-auto">
                <Link href="/" className="hover:opacity-100 transition-opacity">Home</Link>
                <Link href="/dashboard" className="hover:opacity-100 transition-opacity">Dashboard</Link>

                {user ? (
                    <form action={signOutAction}>
                        <button
                            type="submit"
                            className="hover:opacity-100 transition-opacity text-red-500/80 hover:text-red-500"
                        >
                            Sign Out
                        </button>
                    </form>
                ) : (
                    <Link
                        href="/login"
                        className="hover:opacity-100 transition-opacity bg-gradz-charcoal text-gradz-cream px-4 py-2 rounded-full text-xs"
                    >
                        Sign In
                    </Link>
                )}
            </nav>
        </header>
    );
}
