"use client";

import { useEffect, useRef, useState } from "react";

// ==========================================
// Card 01 — "What They Take"
// Drain Counter: data given away ticking up, ₹0 frozen
// Exact copy from Trove AI
// ==========================================
const platforms = [
    { name: "Instagram", icon: "◎", what: "Your Photos & Stories" },
    { name: "TikTok", icon: "♫", what: "Your Videos & Watch Time" },
    { name: "Google", icon: "◉", what: "Your Location & Searches" },
    { name: "YouTube", icon: "▶", what: "Your Watch History" },
    { name: "Facebook", icon: "◈", what: "Your Social Graph" },
    { name: "Twitter/X", icon: "✦", what: "Your Opinions & Posts" },
];

export function DataGravityWell() {
    const [drainedTB, setDrainedTB] = useState(847.3);
    const [visibleRows, setVisibleRows] = useState(platforms.slice(0, 4));
    const [activeIdx, setActiveIdx] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // IntersectionObserver to pause animations when off-screen
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.1 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        // Rapidly tick up the "data given away" counter
        const drainInterval = setInterval(() => {
            setDrainedTB((prev) => prev + (Math.random() * 2 + 0.5));
        }, 80);

        // Cycle through platforms
        const platformInterval = setInterval(() => {
            setActiveIdx((prev) => {
                const next = (prev + 1) % platforms.length;
                setVisibleRows(() => {
                    const rows = [];
                    for (let i = 0; i < 4; i++) {
                        rows.push(platforms[(next + i) % platforms.length]);
                    }
                    return rows;
                });
                return next;
            });
        }, 2500);

        return () => {
            clearInterval(drainInterval);
            clearInterval(platformInterval);
        };
    }, [isVisible]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-h-[420px] bg-gradz-cream/5 border border-gradz-cream/10 p-6 flex flex-col justify-between"
            style={{
                clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)",
            }}
        >
            <div>
                <div className="font-mono text-clay text-[0.65rem] tracking-widest mb-5 uppercase">
                    THE PROBLEM // DATA EXPLOITATION
                </div>

                {/* Big drain counter */}
                <div className="mb-6">
                    <div className="font-mono text-[0.6rem] text-gradz-cream/40 mb-1 uppercase">
                        Your Data Given Away For Free
                    </div>
                    <div className="font-serif font-extrabold text-[2rem] md:text-[2.4rem] text-gradz-cream leading-none tracking-tight tabular-nums">
                        {drainedTB.toFixed(1)}{" "}
                        <span className="text-gradz-cream/40 text-[1rem]">TB</span>
                    </div>
                </div>

                {/* Platform rows */}
                <div className="flex flex-col gap-3 overflow-hidden">
                    {visibleRows.map((platform, i) => (
                        <div
                            key={`${platform.name}-${activeIdx}-${i}`}
                            className="grid grid-cols-[auto_1fr_auto] gap-3 items-center font-mono text-[0.65rem] md:text-[0.7rem] animate-slide-down"
                            style={{ opacity: 1 - i * 0.15 }}
                        >
                            <span className="text-gradz-cream/30 text-sm">
                                {platform.icon}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-gradz-cream/80 font-medium">
                                    {platform.name}
                                </span>
                                <span className="text-gradz-cream/40 text-[0.55rem]">
                                    {platform.what}
                                </span>
                            </div>
                            <span className="text-red-400/80 font-bold animate-pulse">
                                ₹0
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-gradz-cream/10 mt-4">
                <div className="font-mono text-[0.65rem] md:text-[0.75rem] text-gradz-cream flex justify-between tracking-wide">
                    <span>TOTAL PAID TO YOU:</span>
                    <span className="text-red-400/80 font-bold">₹0</span>
                </div>
            </div>
        </div>
    );
}
