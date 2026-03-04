"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

// =====================================
// Artifact: The Upload Constellation
// =====================================
function UploadConstellation() {
    const containerRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const squares = gsap.utils.toArray('.constellation-square');
            const lines = gsap.utils.toArray('.constellation-line');

            const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

            // Reveal squares
            tl.fromTo(squares,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, stagger: 0.05, ease: "back.out(1.7)" }
            )
                // Draw lines
                .fromTo(lines,
                    { strokeDashoffset: 100 },
                    { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" },
                    "-=0.5"
                )
                // Pulse selected ones
                .to('.constellation-pulse', {
                    fill: "var(--color-clay)",
                    duration: 0.4,
                    yoyo: true,
                    repeat: 3
                }, "+=0.2")
                // Scanning line
                .fromTo('.constellation-scanner',
                    { y: 0, opacity: 1 },
                    { y: 500, opacity: 0, duration: 2, ease: "linear" },
                    0
                )
                // Hide all
                .to([squares, lines], { opacity: 0, duration: 0.5 }, "+=1");

        }, containerRef);
        return () => ctx.revert();
    }, []);

    // Use a fixed seed for random data generation so it matches between client and server
    // Note: in a real app you might want to generate this only on the client
    const [squares, setSquares] = useState<{ id: number; x: number; y: number; isPulsing: boolean }[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSquares(Array.from({ length: 40 }).map((_, i) => ({
                id: i,
                x: 40 + Math.random() * 420,
                y: 40 + Math.random() * 420,
                isPulsing: i % 13 === 0
            })));
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    const lines = squares.slice(0, -1).map((sq, i) => ({
        id: i,
        x1: sq.x, y1: sq.y,
        x2: squares[i + 1].x, y2: squares[i + 1].y
    }));

    return (
        <svg ref={containerRef} viewBox="0 0 500 500" className="w-full h-full max-w-[400px]">
            {lines.map(line => (
                <line
                    key={`l-${line.id}`}
                    className="constellation-line"
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                    stroke="rgba(242,240,233,0.15)" strokeWidth="1"
                    strokeDasharray="100" strokeDashoffset="100"
                />
            ))}
            {squares.map(sq => (
                <rect
                    key={`s-${sq.id}`}
                    className={cn("constellation-square", sq.isPulsing && "constellation-pulse")}
                    x={sq.x - 4} y={sq.y - 4} width="8" height="8"
                    stroke="rgba(242,240,233,0.3)" fill="rgba(242,240,233,0.05)"
                    strokeWidth="1"
                    style={{ transformOrigin: `${sq.x}px ${sq.y}px` }}
                />
            ))}
            <rect className="constellation-scanner" x="0" y="0" width="500" height="2" fill="var(--color-clay)" opacity="0" />
        </svg>
    );
}

// =====================================
// Artifact: Quality Spectrum Equalizer
// =====================================
function QualitySpectrum() {
    const [score, setScore] = useState(94.7);
    const [bars, setBars] = useState<{ height: number; speed: number; isPremium: boolean }[]>([]);

    useEffect(() => {
        const initTimer = setTimeout(() => {
            setBars(Array.from({ length: 16 }).map((_, i) => ({
                height: 40 + Math.random() * 60,
                speed: 1 + Math.random(),
                isPremium: i === 3 || i === 8 || i === 12,
            })));
        }, 10);

        const interval = setInterval(() => {
            setScore(94.7 + (Math.random() * 0.6 - 0.3));
        }, 1500);
        return () => {
            clearInterval(interval);
            clearTimeout(initTimer);
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col justify-center max-w-[400px]">
            <div className="font-fraunces font-extrabold text-[2rem] text-charcoal mb-8 transition-all duration-300">
                QUALITY SCORE: {score.toFixed(1)}
            </div>
            <div className="flex items-end justify-between h-[160px] gap-1 mb-4">
                {bars.map((bar, i) => (
                    <div
                        key={i}
                        className={cn("w-full rounded-t-sm origin-bottom", bar.isPremium ? "bg-clay filter brightness-110" : "bg-moss")}
                        style={{
                            height: `${bar.height}%`,
                            animation: `eqBounce ${bar.speed}s infinite alternate ease-in-out`
                        }}
                    />
                ))}
            </div>
            <div className="font-fira-code text-[0.6rem] text-charcoal/40 tracking-widest flex justify-between uppercase">
                <span>RESOLUTION</span>
                <span>SHARPNESS</span>
                <span>DIVERSITY</span>
                <span>METADATA</span>
            </div>


        </div>
    );
}

// =====================================
// Artifact: Earnings Waveform
// =====================================
function EarningsWaveform() {
    const containerRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to('.waveform-path-active', {
                strokeDashoffset: 0,
                duration: 3,
                ease: "none",
                repeat: -1
            });

            gsap.to('.waveform-dot', {
                x: 400,
                duration: 3,
                ease: "none",
                repeat: -1
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div className="w-full max-w-[500px] flex flex-col">
            <div className="font-fira-code text-clay text-[0.7rem] mb-4 text-right">↑ TOP EARNER: $847/MO</div>
            <svg ref={containerRef} viewBox="0 0 400 160" className="w-full h-[160px] overflow-visible">
                {/* Baseline Average */}
                <path
                    d="M0 140 L40 130 L80 135 L120 110 L160 115 L200 90 L240 100 L280 70 L320 80 L360 50 L400 40"
                    fill="none" stroke="var(--color-moss)" strokeWidth="8" opacity="0.3" strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Active Earnings */}
                <path
                    className="waveform-path-active"
                    d="M0 150 L30 140 L60 145 L90 120 L120 130 L150 90 L180 110 L210 60 L240 80 L270 40 L300 50 L330 20 L360 30 L400 0"
                    fill="none" stroke="var(--color-clay)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="1000" strokeDashoffset="1000"
                />
                <circle className="waveform-dot" cx="0" cy="0" r="4" fill="var(--color-clay)" />
            </svg>
            <div className="flex justify-between font-fira-code text-[0.6rem] text-cream/40 mt-4 border-t border-cream/10 pt-2">
                <span>WK1</span>
                <span>WK4</span>
                <span>WK8</span>
                <span>WK12</span>
            </div>
        </div>
    );
}

// =====================================
// Main Component
// =====================================
export function Protocol() {
    const containerRef = useRef<HTMLDivElement>(null);
    const chamber1Ref = useRef<HTMLDivElement>(null);
    const chamber2Ref = useRef<HTMLDivElement>(null);
    const chamber3Ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Folding Mechanic - Note: elements are already display:sticky via CSS. 
            // We use GSAP to animate perspective and rotateX as they get pinned.

            // Chamber 1 Folds when Chamber 2 approaches
            gsap.to(chamber1Ref.current, {
                rotateX: -8,
                scale: 0.88,
                opacity: 0.4,
                transformOrigin: "top center",
                ease: "none",
                scrollTrigger: {
                    trigger: chamber2Ref.current,
                    start: "top bottom",
                    end: "top top",
                    scrub: true,
                }
            });

            // Chamber 2 Folds when Chamber 3 approaches
            gsap.to(chamber2Ref.current, {
                rotateX: -8,
                scale: 0.88,
                opacity: 0.4,
                transformOrigin: "top center",
                ease: "none",
                scrollTrigger: {
                    trigger: chamber3Ref.current,
                    start: "top bottom",
                    end: "top top",
                    scrub: true,
                }
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} id="how-it-works" className="relative w-full bg-charcoal" style={{ perspective: "1200px" }}>

            {/* Chamber 1: UPLOAD */}
            <div
                ref={chamber1Ref}
                className="sticky top-0 w-full h-[100dvh] bg-moss flex items-center justify-center p-8 md:p-16 overflow-hidden rounded-b-[3rem] z-10 will-change-transform"
            >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-fira-code text-[0.7rem] text-clay tracking-widest" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                    CH · 01
                </div>
                <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="font-fraunces font-extrabold text-cream/50 text-[1rem] tracking-[0.1em] uppercase mb-4">The Contribution</div>
                        <h2 className="font-cormorant italic font-light text-[clamp(4.5rem,8vw,8rem)] text-cream leading-[0.9] mb-8">
                            *Upload.*
                        </h2>
                        <p className="font-epilogue font-light text-cream/65 text-[1.1rem] leading-relaxed max-w-md">
                            Photograph your world. Record your reality. Every image, every video, every clip carries value to the AI companies rebuilding human vision.
                        </p>
                    </div>
                    <div className="flex justify-center md:justify-end h-[300px] md:h-auto">
                        <UploadConstellation />
                    </div>
                </div>
            </div>

            {/* Chamber 2: VALIDATE */}
            <div
                ref={chamber2Ref}
                className="sticky top-0 w-full h-[100dvh] bg-cream flex items-center justify-center p-8 md:p-16 overflow-hidden rounded-b-[3rem] z-20 will-change-transform shadow-[0_-20px_50px_rgba(26,26,26,0.3)]"
            >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-fira-code text-[0.7rem] text-moss/40 tracking-widest" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                    CH · 02
                </div>
                <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1 flex justify-center md:justify-start h-[300px] md:h-auto">
                        <QualitySpectrum />
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="font-fraunces font-extrabold text-moss/50 text-[1rem] tracking-[0.1em] uppercase mb-4">The Validation</div>
                        <h2 className="font-cormorant italic font-light text-[clamp(4.5rem,8vw,8rem)] text-moss leading-[0.9] mb-8">
                            *Verify.*
                        </h2>
                        <p className="font-epilogue font-light text-charcoal/65 text-[1.1rem] leading-relaxed max-w-md">
                            Every submission is quality-scored and tagged. The higher your data quality, the higher your earnings multiplier.
                        </p>
                    </div>
                </div>
            </div>

            {/* Chamber 3: EARN */}
            <div
                ref={chamber3Ref}
                className="sticky top-0 w-full h-[100dvh] bg-charcoal flex items-center justify-center p-8 md:p-16 overflow-hidden z-30 will-change-transform shadow-[0_-20px_50px_rgba(26,26,26,0.5)]"
            >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-fira-code text-[0.7rem] text-clay tracking-widest" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                    CH · 03
                </div>
                <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="font-fraunces font-extrabold text-cream/50 text-[1rem] tracking-[0.1em] uppercase mb-4">The Reward</div>
                        <h2 className="font-cormorant italic font-light text-[clamp(4.5rem,8vw,8rem)] text-clay leading-[0.9] mb-8">
                            *Yours.*
                        </h2>
                        <p className="font-epilogue font-light text-cream/65 text-[1.1rem] leading-relaxed max-w-md">
                            Payment lands in your account the moment your data is licensed. No waiting. No minimum threshold. No middleman taking the margin that belongs to you.
                        </p>
                    </div>
                    <div className="flex justify-center md:justify-end h-[300px] md:h-auto">
                        <EarningsWaveform />
                    </div>
                </div>
            </div>

        </section>
    );
}
