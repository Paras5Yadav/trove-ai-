"use client";

import { ArrowUpRight, Orbit } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const footerLinks = [
    {
        title: "Exchange",
        links: [
            { label: "Market Data", href: "#" },
            { label: "Contributor Tiers", href: "#" },
            { label: "Earnings Calculator", href: "#" },
            { label: "Asset Demand", href: "#" },
        ]
    },
    {
        title: "Protocol",
        links: [
            { label: "Node Network", href: "#" },
            { label: "Validation Engine", href: "#" },
            { label: "Licensing Terms", href: "#" },
            { label: "API Documentation", href: "#" },
        ]
    },
    {
        title: "Enterprise",
        links: [
            { label: "Data Procurement", href: "#" },
            { label: "Custom Clusters", href: "#" },
            { label: "Ethics & Compliance", href: "#" },
            { label: "Contact Sales", href: "#" },
        ]
    }
];

function SyncTime() {
    const [time, setTime] = useState('--:--:--');
    useEffect(() => {
        const fmt = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
        setTime(fmt());
        const interval = setInterval(() => setTime(fmt()), 1000);
        return () => clearInterval(interval);
    }, []);
    return <span suppressHydrationWarning>{time}</span>;
}

export function Footer() {
    return (
        <footer className="bg-charcoal text-cream pt-24 pb-8 px-4 md:px-8 relative z-20 border-t border-cream/10">

            <div className="max-w-7xl mx-auto flex flex-col gap-20">

                {/* Top Section: Title & Status */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-b border-cream/10 pb-12">

                    <div className="flex flex-col gap-6 max-w-lg">
                        <div className="flex items-center gap-3">
                            <Orbit className="w-8 h-8 text-moss-light animate-spin-slow" />
                            <h2 className="font-fraunces font-extrabold text-3xl tracking-widest uppercase">Trove AI</h2>
                        </div>
                        <p className="font-epilogue text-cream/60 leading-relaxed">
                            The Sovereign Exchange. Your data. Your asset. Your terms. We route human context to the models building tomorrow.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="font-fira-code text-[0.65rem] tracking-widest text-clay uppercase">
                            SYSTEM TELEMETRY
                        </div>

                        <div className="flex items-center gap-4 bg-cream/5 border border-cream/10 rounded-full py-3 px-6">
                            <div className="relative flex items-center justify-center w-3 h-3">
                                <div className="absolute w-full h-full bg-green-500 rounded-full animate-ping opacity-60" />
                                <div className="relative w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-fira-code text-xs font-semibold text-cream">EXCHANGE ONLINE</span>
                                <span className="font-fira-code text-[0.6rem] text-cream/40 overflow-hidden whitespace-nowrap">
                                    Last sync: <SyncTime /> UTC
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Middle Section: Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 font-fira-code text-sm">

                    {footerLinks.map((column) => (
                        <div key={column.title} className="flex flex-col gap-6">
                            <h4 className="text-[0.7rem] text-clay tracking-widest uppercase">{column.title}</h4>
                            <ul className="flex flex-col gap-4">
                                {column.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="group flex items-center gap-2 text-cream/60 hover:text-moss-light transition-colors"
                                        >
                                            <span className="relative">
                                                {link.label}
                                                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-moss-light transition-all duration-300 group-hover:w-full" />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div className="flex flex-col gap-6">
                        <h4 className="text-[0.7rem] text-clay tracking-widest uppercase">Connect</h4>
                        <ul className="flex flex-col gap-4">
                            <li>
                                <a href="#" className="group flex items-center gap-1 text-cream/60 hover:text-cream transition-colors">
                                    Twitter/X <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                            </li>
                            <li>
                                <a href="#" className="group flex items-center gap-1 text-cream/60 hover:text-cream transition-colors">
                                    Discord Network <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                            </li>
                            <li>
                                <a href="#" className="group flex items-center gap-1 text-cream/60 hover:text-cream transition-colors">
                                    GitHub <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Section: Copyright */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-cream/10">
                    <div className="font-fira-code text-[0.65rem] text-cream/40 uppercase tracking-widest">
                        © {new Date().getFullYear()} Trove AI Protocol. All rights reserved.
                    </div>
                    <div className="font-cormorant italic text-xl text-moss-light/60">
                        *Algorithm is truth.*
                    </div>
                </div>

            </div>

        </footer>
    );
}
