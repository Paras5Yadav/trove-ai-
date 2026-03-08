import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { VaultLogo } from "@/components/icons/VaultLogo";
import { ClientNav } from "@/components/ClientNav";

export async function Navbar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between pointer-events-none">
            <div className="text-xl font-bold tracking-tighter opacity-80 pointer-events-auto flex items-center gap-2">
                <VaultLogo className="w-6 h-6 text-moss" />
                <Link href="/">TROVE</Link>
            </div>
            <ClientNav isLoggedIn={!!user} />
        </header>
    );
}
