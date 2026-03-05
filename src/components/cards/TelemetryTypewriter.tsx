"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ==========================================
// Card 02 — "What It's Actually Worth"
// Vault Unlock: scrambled prices decrypt to reveal value
// Exact copy from Trove AI
// ==========================================
const dataValues = [
    { type: "Street Photos", value: "$0.12", scrambled: "$█.██" },
    { type: "4K Video Clip", value: "$3.40", scrambled: "$█.██" },
    { type: "Drone Aerial", value: "$8.60", scrambled: "$█.██" },
    { type: "Voice Recording", value: "$0.80", scrambled: "$█.██" },
    { type: "Dashcam Footage", value: "$2.50", scrambled: "$█.██" },
    { type: "Egocentric Clip", value: "$1.20", scrambled: "$█.██" },
];

export function LiveAuctionBoard() {
    const [unlockedCount, setUnlockedCount] = useState(0);
    const [scrambleChars, setScrambleChars] = useState<string[]>(
        dataValues.map(() => "$█.██")
    );
    const scrambleRef = useRef<NodeJS.Timeout | null>(null);
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
        let currentUnlock = 0;

        const unlockNext = () => {
            if (currentUnlock < dataValues.length) {
                const idx = currentUnlock;
                const chars = "█▓▒░$0123456789.";
                let scrambleCount = 0;

                const scrambleInterval = setInterval(() => {
                    setScrambleChars((prev) => {
                        const next = [...prev];
                        next[idx] =
                            "$" +
                            Array.from(
                                { length: 3 },
                                () => chars[Math.floor(Math.random() * chars.length)]
                            ).join("");
                        return next;
                    });
                    scrambleCount++;
                    if (scrambleCount > 8) {
                        clearInterval(scrambleInterval);
                        setScrambleChars((prev) => {
                            const next = [...prev];
                            next[idx] = dataValues[idx].value;
                            return next;
                        });
                        setUnlockedCount(idx + 1);
                    }
                }, 60);

                currentUnlock++;
                setTimeout(unlockNext, 700);
            } else {
                setTimeout(() => {
                    setUnlockedCount(0);
                    setScrambleChars(dataValues.map(() => "$█.██"));
                    currentUnlock = 0;
                    setTimeout(unlockNext, 800);
                }, 3000);
            }
        };

        const timeout = setTimeout(unlockNext, 600);
        const currentScrambleRef = scrambleRef.current;
        return () => {
            clearTimeout(timeout);
            if (currentScrambleRef) clearInterval(currentScrambleRef);
        };
    }, [isVisible]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-h-[420px] bg-[#2E4036] border border-[#3a5247]/40 p-6 flex flex-col justify-between"
            style={{
                clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)",
            }}
        >
            <div>
                <div className="font-mono text-gradz-cream/40 text-[0.65rem] tracking-widest mb-5 uppercase">
                    THE REVELATION // HIDDEN VALUE
                </div>

                <div className="mb-6">
                    <div className="font-mono text-[0.6rem] text-gradz-cream/40 mb-1 uppercase">
                        Decrypting Market Value
                    </div>
                    <div className="font-serif font-extrabold text-[1.4rem] md:text-[1.6rem] text-gradz-cream leading-none tracking-tight flex items-center gap-3">
                        <span>Your Data Has Value</span>
                        <span className="w-2 h-2 rounded-full bg-clay animate-pulse" />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {dataValues.map((item, i) => {
                        const isUnlocked = i < unlockedCount;
                        return (
                            <div
                                key={i}
                                className="grid grid-cols-[1fr_auto] gap-3 items-center font-mono text-[0.65rem] md:text-[0.7rem]"
                            >
                                <span
                                    className={cn(
                                        "transition-colors duration-300",
                                        isUnlocked ? "text-gradz-cream" : "text-gradz-cream/50"
                                    )}
                                >
                                    {item.type}
                                </span>
                                <span
                                    className={cn(
                                        "font-bold tabular-nums tracking-wider transition-all duration-300 min-w-[55px] text-right",
                                        isUnlocked
                                            ? "text-clay drop-shadow-[0_0_6px_rgba(204,88,51,0.5)]"
                                            : "text-gradz-cream/25"
                                    )}
                                >
                                    {scrambleChars[i]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-4 border-t border-gradz-cream/10 mt-4">
                <p className="font-light text-[0.78rem] text-gradz-cream/55 leading-relaxed italic">
                    They just never told you.
                </p>
            </div>
        </div>
    );
}
