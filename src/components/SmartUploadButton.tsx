"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export function SmartUploadButton() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        supabase.auth.getUser().then(({ data: { user } }) => {
            setIsLoggedIn(!!user);
        });
    }, []);

    return (
        <Link href={isLoggedIn ? "/dashboard" : "/policies"}>
            <button className="bg-gradz-charcoal text-gradz-cream px-8 py-4 rounded-full hover:bg-black hover:scale-105 transition-all duration-300">
                Start Uploading
            </button>
        </Link>
    );
}
