"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// Card 01 — "What They Take"
// Drain Counter: data given away ticking up, $0 frozen
// ==========================================
const platforms = [
    { name: 'Instagram', icon: '◎', what: 'Your Photos & Stories' },
    { name: 'TikTok', icon: '♫', what: 'Your Videos & Watch Time' },
    { name: 'Google', icon: '◉', what: 'Your Location & Searches' },
    { name: 'YouTube', icon: '▶', what: 'Your Watch History' },
    { name: 'Facebook', icon: '◈', what: 'Your Social Graph' },
    { name: 'Twitter/X', icon: '✦', what: 'Your Opinions & Posts' },
];

function DataDrain() {
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
            setDrainedTB(prev => prev + (Math.random() * 2 + 0.5));
        }, 80);

        // Cycle through platforms
        const platformInterval = setInterval(() => {
            setActiveIdx(prev => {
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
        <div ref={containerRef} className="w-full h-full min-h-[420px] bg-cream/5 border border-cream/10 p-6 flex flex-col justify-between" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)" }}>
            <div>
                <div className="font-fira-code text-clay text-[0.65rem] tracking-widest mb-5 uppercase">
                    THE PROBLEM // DATA EXPLOITATION
                </div>

                {/* Big drain counter */}
                <div className="mb-6">
                    <div className="font-fira-code text-[0.6rem] text-cream/40 mb-1 uppercase">Your Data Given Away For Free</div>
                    <div className="font-fraunces font-extrabold text-[2rem] md:text-[2.4rem] text-cream leading-none tracking-tight tabular-nums">
                        {drainedTB.toFixed(1)} <span className="text-cream/40 text-[1rem]">TB</span>
                    </div>
                </div>

                {/* Platform rows */}
                <div className="flex flex-col gap-3 overflow-hidden">
                    {visibleRows.map((platform, i) => (
                        <div
                            key={`${platform.name}-${activeIdx}-${i}`}
                            className="grid grid-cols-[auto_1fr_auto] gap-3 items-center font-fira-code text-[0.65rem] md:text-[0.7rem] animate-slide-down"
                            style={{ opacity: 1 - (i * 0.15) }}
                        >
                            <span className="text-cream/30 text-sm">{platform.icon}</span>
                            <div className="flex flex-col">
                                <span className="text-cream/80 font-medium">{platform.name}</span>
                                <span className="text-cream/40 text-[0.55rem]">{platform.what}</span>
                            </div>
                            <span className="text-red-400/80 font-bold animate-pulse">$0.00</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-cream/10 mt-4">
                <div className="font-fira-code text-[0.65rem] md:text-[0.75rem] text-cream flex justify-between tracking-wide">
                    <span>TOTAL PAID TO YOU:</span>
                    <span className="text-red-400/80 font-bold">$0.00</span>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Card 02 — "What It's Actually Worth"
// Vault Unlock: scrambled prices decrypt to reveal value
// ==========================================
const dataValues = [
    { type: 'Street Photos', value: '$0.12', scrambled: '$█.██' },
    { type: '4K Video Clip', value: '$3.40', scrambled: '$█.██' },
    { type: 'Drone Aerial', value: '$8.60', scrambled: '$█.██' },
    { type: 'Voice Recording', value: '$0.80', scrambled: '$█.██' },
    { type: 'Dashcam Footage', value: '$2.50', scrambled: '$█.██' },
    { type: 'Egocentric Clip', value: '$1.20', scrambled: '$█.██' },
];

function VaultUnlock() {
    const [unlockedCount, setUnlockedCount] = useState(0);
    const [scrambleChars, setScrambleChars] = useState<string[]>(dataValues.map(() => '$█.██'));
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
                const chars = '█▓▒░$0123456789.';
                let scrambleCount = 0;

                const scrambleInterval = setInterval(() => {
                    setScrambleChars(prev => {
                        const next = [...prev];
                        next[idx] = '$' + Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                        return next;
                    });
                    scrambleCount++;
                    if (scrambleCount > 8) {
                        clearInterval(scrambleInterval);
                        setScrambleChars(prev => {
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
                    setScrambleChars(dataValues.map(() => '$█.██'));
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
        <div ref={containerRef} className="w-full h-full min-h-[420px] bg-moss border border-moss-light/20 p-6 flex flex-col justify-between" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)" }}>
            <div>
                <div className="font-fira-code text-cream/40 text-[0.65rem] tracking-widest mb-5 uppercase">
                    THE REVELATION // HIDDEN VALUE
                </div>

                <div className="mb-6">
                    <div className="font-fira-code text-[0.6rem] text-cream/40 mb-1 uppercase">Decrypting Market Value</div>
                    <div className="font-fraunces font-extrabold text-[1.4rem] md:text-[1.6rem] text-cream leading-none tracking-tight flex items-center gap-3">
                        <span>Your Data Has Value</span>
                        <span className="w-2 h-2 rounded-full bg-clay animate-pulse" />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {dataValues.map((item, i) => {
                        const isUnlocked = i < unlockedCount;
                        return (
                            <div key={i} className="grid grid-cols-[1fr_auto] gap-3 items-center font-fira-code text-[0.65rem] md:text-[0.7rem]">
                                <span className={cn("transition-colors duration-300", isUnlocked ? "text-cream" : "text-cream/50")}>{item.type}</span>
                                <span className={cn(
                                    "font-bold tabular-nums tracking-wider transition-all duration-300 min-w-[55px] text-right",
                                    isUnlocked
                                        ? "text-clay drop-shadow-[0_0_6px_rgba(204,88,51,0.5)]"
                                        : "text-cream/25"
                                )}>
                                    {scrambleChars[i]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-4 border-t border-cream/10 mt-4">
                <p className="font-epilogue font-light text-[0.78rem] text-cream/55 leading-relaxed">
                    They just never told you.
                </p>
            </div>
        </div>
    );
}

// ==========================================
// Card 03 — "What Trove AI Pays You"
// Before/After Morph: $0 flips to real earnings
// ==========================================
const earningsRows = [
    { label: 'PHOTOS ×50', zero: '$0.00', real: '+$4.00' },
    { label: 'VIDEOS 1080p ×10', zero: '$0.00', real: '+$3.40' },
    { label: '4K VIDEOS ×5', zero: '$0.00', real: '+$8.50' },
    { label: 'DRONE ×3', zero: '$0.00', real: '+$8.40' },
    { label: 'EGOCENTRIC ×8', zero: '$0.00', real: '+$9.60' },
    { label: 'AUDIO ×20', zero: '$0.00', real: '+$2.00' },
];

function EarningsFlip() {
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
        <div ref={containerRef} className="w-full h-full min-h-[420px] bg-cream/5 border border-cream/10 p-6 flex flex-col justify-between" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)" }}>
            <div>
                <div className="font-fira-code text-clay text-[0.65rem] tracking-widest mb-5 uppercase">
                    THE SOLUTION // TROVE AI PAYS YOU
                </div>

                <div className="mb-6">
                    <div className="font-fira-code text-[0.6rem] text-cream/40 mb-1 uppercase">Same Data, Different Outcome</div>
                    <div className="font-fraunces font-extrabold text-[1.4rem] md:text-[1.6rem] text-cream leading-none tracking-tight">
                        You Deserve Every Cent
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {earningsRows.map((row, i) => {
                        const isFlipped = i < flippedCount;
                        return (
                            <div key={i} className="grid grid-cols-[1.5fr_1fr_auto] gap-2 items-center font-fira-code text-[0.65rem] md:text-[0.7rem] text-cream">
                                <span className="truncate text-cream/70">{row.label}</span>
                                <div className="w-full h-[5px] bg-cream/10 relative overflow-hidden flex">
                                    <div
                                        className={cn(
                                            "absolute top-0 left-0 h-full w-full origin-left transition-transform duration-500 ease-out",
                                            isFlipped ? "bg-moss" : "bg-red-400/30"
                                        )}
                                        style={{ transform: isFlipped ? 'scaleX(1)' : 'scaleX(0.15)' }}
                                    />
                                    <div className="absolute inset-0 flex justify-between">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <div key={j} className="h-full w-[1px] bg-charcoal mix-blend-overlay" />
                                        ))}
                                    </div>
                                </div>
                                <span className={cn(
                                    "text-right font-bold tabular-nums min-w-[55px] transition-all duration-500",
                                    isFlipped
                                        ? "text-clay drop-shadow-[0_0_6px_rgba(204,88,51,0.5)]"
                                        : "text-red-400/50"
                                )}>
                                    {isFlipped ? row.real : row.zero}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="-mx-6 border-t border-cream/10 mt-6 pt-4 px-6 flex items-center justify-between min-h-[48px]">
                {showTotal && (
                    <>
                        <div className="animate-fade-in font-fraunces font-extrabold text-cream text-[0.9rem] tracking-wider uppercase">
                            Estimated Monthly: $432.90
                        </div>
                        <svg className="w-5 h-5 text-clay animate-draw-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" strokeDasharray="50" strokeDashoffset="50" />
                        </svg>
                    </>
                )}
            </div>
        </div>
    );
}

export function Features() {
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                headerRef.current?.children ? Array.from(headerRef.current.children) : [],
                { y: 40, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    stagger: 0.15,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 75%",
                    }
                }
            );

            gsap.fromTo(
                ".instrument-panel",
                { y: 60, opacity: 0, scale: 0.98 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "back.out(1.2)",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 60%",
                    }
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="features" ref={sectionRef} className="py-24 md:py-32 px-4 md:px-8 bg-charcoal text-cream relative">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-16">

                {/* Section Header */}
                <div ref={headerRef} className="flex flex-col items-start px-4 md:px-0">
                    <div className="font-fira-code text-clay text-[0.7rem] tracking-widest uppercase mb-6 drop-shadow-sm">
                        {"> "}THE DATA REVOLUTION // YOUR DATA. YOUR PROFIT.
                    </div>
                    <h2 className="font-fraunces font-extrabold text-[clamp(2.5rem,5vw,4.5rem)] text-cream leading-[0.9] tracking-tight uppercase">
                        They Take It Free.
                    </h2>
                    <h3 className="font-cormorant italic text-[clamp(3.5rem,7vw,6rem)] text-clay leading-[0.9] mt-2">
                        *We Pay You.*
                    </h3>
                </div>

                {/* Three Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="instrument-panel">
                        <DataDrain />
                    </div>
                    <div className="instrument-panel">
                        <VaultUnlock />
                    </div>
                    <div className="instrument-panel">
                        <EarningsFlip />
                    </div>
                </div>
            </div>
        </section>
    );
}
