"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Vault } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const isDashboardPage = pathname === "/dashboard";

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-500">
            <nav
                className={cn(
                    "flex items-center justify-between px-6 py-4 rounded-full w-full max-w-5xl transition-all duration-500",
                    isScrolled
                        ? "bg-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-moss/10"
                        : "bg-transparent border border-transparent"
                )}
            >
                <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                    <Vault className={cn("w-6 h-6 transition-transform group-hover:scale-110", isScrolled ? "text-moss" : "text-cream")} />
                    <span className={cn("font-outfit font-bold tracking-tight text-lg transition-colors", isScrolled ? "text-moss" : "text-cream")}>TROVE AI</span>
                </Link>

                <ul className={cn("hidden md:flex items-center gap-8 font-jakarta text-sm font-medium transition-colors", isScrolled ? "text-charcoal" : "text-cream/90")}>
                    <li><Link href={isDashboardPage ? "/#features" : "#features"} className={cn("transition-colors", isScrolled ? "hover:text-moss" : "hover:text-white")}>Intelligence</Link></li>
                    <li><Link href={isDashboardPage ? "/#how-it-works" : "#how-it-works"} className={cn("transition-colors", isScrolled ? "hover:text-moss" : "hover:text-white")}>Protocol</Link></li>
                    <li><Link href={isDashboardPage ? "/#membership" : "#membership"} className={cn("transition-colors", isScrolled ? "hover:text-moss" : "hover:text-white")}>Monetization</Link></li>
                </ul>

                <Link
                    href={isDashboardPage ? "/" : "/dashboard"}
                    className={cn(
                        "magnetic-btn relative overflow-hidden px-6 py-2.5 rounded-full font-jakarta text-sm font-semibold transition-all border",
                        isScrolled
                            ? "bg-moss text-cream border-transparent hover:bg-moss/90"
                            : "bg-transparent text-cream border-cream/30 hover:bg-cream hover:text-moss"
                    )}
                >
                    <span className="magnetic-btn-inner block relative z-10 transition-colors">
                        {isDashboardPage ? "Return" : "Access Dashboard"}
                    </span>
                </Link>
            </nav>
        </header>
    );
}
