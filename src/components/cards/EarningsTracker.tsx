"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ==========================================
// Card 03 — "What Kled Pays You"
// Before/After Morph: $0 flips to real earnings
// Exact copy from DataVault AI
// ==========================================
const earningsRows = [
    { label: "PHOTOS ×50", zero: "$0.00", real: "+$4.00" },
    { label: "VIDEOS 1080p ×10", zero: "$0.00", real: "+$3.40" },
    { label: "4K VIDEOS ×5", zero: "$0.00", real: "+$8.50" },
    { label: "DRONE ×3", zero: "$0.00", real: "+$8.40" },
    { label: "EGOCENTRIC ×8", zero: "$0.00", real: "+$9.60" },
    { label: "AUDIO ×20", zero: "$0.00", real: "+$2.00" },
];

export function RevenueWaterfall() {
    const [flippedCount, setFlippedCount] = useState(0);
    const [showTotal, setShowTotal] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

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
        let currentFlip = 0;

        const flipNext = () => {
            if (currentFlip < earningsRows.length) {
                setFlippedCount(currentFlip + 1);
                currentFlip++;
                setTimeout(flipNext, 500);
            } else {
                setShowTotal(true);
                setTimeout(() => {
                    setFlippedCount(0);
                    setShowTotal(false);
                    currentFlip = 0;
                    setTimeout(flipNext, 800);
                }, 3000);
            }
        };

        const timeout = setTimeout(flipNext, 600);
        return () => clearTimeout(timeout);
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
                    THE SOLUTION // KLED PAYS YOU
                </div>

                <div className="mb-6">
                    <div className="font-mono text-[0.6rem] text-gradz-cream/40 mb-1 uppercase">
                        Same Data, Different Outcome
                    </div>
                    <div className="font-serif font-extrabold text-[1.4rem] md:text-[1.6rem] text-gradz-cream leading-none tracking-tight">
                        You Deserve Every Cent
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {earningsRows.map((row, i) => {
                        const isFlipped = i < flippedCount;
                        return (
                            <div
                                key={i}
                                className="grid grid-cols-[1.5fr_1fr_auto] gap-2 items-center font-mono text-[0.65rem] md:text-[0.7rem] text-gradz-cream"
                            >
                                <span className="truncate text-gradz-cream/70">
                                    {row.label}
                                </span>
                                {/* Progress bar */}
                                <div className="w-full h-[5px] bg-gradz-cream/10 relative overflow-hidden flex">
                                    <div
                                        className={cn(
                                            "absolute top-0 left-0 h-full w-full origin-left transition-transform duration-500 ease-out",
                                            isFlipped ? "bg-[#2E4036]" : "bg-red-400/30"
                                        )}
                                        style={{
                                            transform: isFlipped ? "scaleX(1)" : "scaleX(0.15)",
                                        }}
                                    />
                                    {/* Segmented overlay lines */}
                                    <div className="absolute inset-0 flex justify-between">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <div
                                                key={j}
                                                className="h-full w-[1px] bg-gradz-charcoal mix-blend-overlay"
                                            />
                                        ))}
                                    </div>
                                </div>
                                {/* Price */}
                                <span
                                    className={cn(
                                        "text-right font-bold tabular-nums min-w-[55px] transition-all duration-500",
                                        isFlipped
                                            ? "text-clay drop-shadow-[0_0_6px_rgba(204,88,51,0.5)]"
                                            : "text-red-400/50"
                                    )}
                                >
                                    {isFlipped ? row.real : row.zero}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="-mx-6 border-t border-gradz-cream/10 mt-6 pt-4 px-6 flex items-center justify-between min-h-[48px]">
                {showTotal && (
                    <>
                        <div className="animate-fade-in font-serif font-extrabold text-gradz-cream text-[0.9rem] tracking-wider uppercase">
                            Estimated Monthly: $432.90
                        </div>
                        <svg
                            className="w-5 h-5 text-clay animate-draw-check"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                                strokeDasharray="50"
                                strokeDashoffset="50"
                            />
                        </svg>
                    </>
                )}
            </div>
        </div>
    );
}
