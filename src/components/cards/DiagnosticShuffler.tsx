"use client";

import { useState, useEffect, useRef } from "react";

interface Dot {
    id: number;
    label: string;
    angle: number;
    radius: number;
    speed: number;
    color: string;
    absorbed: boolean;
    opacity: number;
    size: number;
}

const platforms = [
    { label: "Photos", color: "#D9D2E9" },
    { label: "Videos", color: "#C9DEF4" },
    { label: "Audio", color: "#C6E0AC" },
    { label: "Location", color: "#FFD4C2" },
    { label: "Messages", color: "#F7E5A9" },
    { label: "Searches", color: "#FFB385" },
];

export function DataGravityWell() {
    const [dots, setDots] = useState<Dot[]>([]);
    const [dataLost, setDataLost] = useState(0);
    const frameRef = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize dots
    useEffect(() => {
        const initial: Dot[] = platforms.map((p, i) => ({
            id: i,
            label: p.label,
            angle: (Math.PI * 2 * i) / platforms.length,
            radius: 70 + Math.random() * 20,
            speed: 0.008 + Math.random() * 0.006,
            color: p.color,
            absorbed: false,
            opacity: 1,
            size: 6,
        }));
        setDots(initial);
    }, []);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = 280;
        const H = 220;
        const cx = W / 2;
        const cy = H / 2;

        canvas.width = W;
        canvas.height = H;

        let localDots = [...dots];
        let localDataLost = dataLost;

        const animate = () => {
            ctx.clearRect(0, 0, W, H);

            // Draw gravitational rings
            for (let r = 20; r <= 80; r += 20) {
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(124, 109, 175, ${0.08 + (80 - r) * 0.002})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // Draw center black hole
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
            gradient.addColorStop(0, "rgba(26, 26, 26, 1)");
            gradient.addColorStop(0.6, "rgba(124, 109, 175, 0.4)");
            gradient.addColorStop(1, "rgba(124, 109, 175, 0)");
            ctx.beginPath();
            ctx.arc(cx, cy, 18, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Inner core
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#1A1A1A";
            ctx.fill();

            // Update and draw dots
            localDots = localDots.map((dot) => {
                if (dot.absorbed) return dot;

                const newAngle = dot.angle + dot.speed;
                const pullSpeed = 0.15;
                const newRadius = dot.radius - pullSpeed;

                if (newRadius <= 12) {
                    localDataLost += Math.random() * 50 + 10;
                    return { ...dot, absorbed: true, opacity: 0, radius: 0, angle: newAngle };
                }

                // Draw trail
                const trailX = cx + Math.cos(newAngle - 0.3) * (newRadius + 3);
                const trailY = cy + Math.sin(newAngle - 0.3) * (newRadius + 3);
                ctx.beginPath();
                ctx.arc(trailX, trailY, 2, 0, Math.PI * 2);
                ctx.fillStyle = `${dot.color}22`;
                ctx.fill();

                // Draw dot
                const x = cx + Math.cos(newAngle) * newRadius;
                const y = cy + Math.sin(newAngle) * newRadius;

                // Glow
                const dotGlow = ctx.createRadialGradient(x, y, 0, x, y, dot.size * 2);
                const isNearCenter = newRadius < 35;
                const dotColor = isNearCenter ? "#CC5833" : dot.color;
                dotGlow.addColorStop(0, `${dotColor}88`);
                dotGlow.addColorStop(1, `${dotColor}00`);
                ctx.beginPath();
                ctx.arc(x, y, dot.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = dotGlow;
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(x, y, dot.size, 0, Math.PI * 2);
                ctx.fillStyle = dotColor;
                ctx.fill();

                // Label
                ctx.font = "9px monospace";
                ctx.fillStyle = `${dotColor}CC`;
                ctx.textAlign = "center";
                ctx.fillText(dot.label, x, y - dot.size - 4);

                return { ...dot, angle: newAngle, radius: newRadius };
            });

            // Check if all absorbed → reset
            if (localDots.every((d) => d.absorbed)) {
                localDots = platforms.map((p, i) => ({
                    id: i,
                    label: p.label,
                    angle: (Math.PI * 2 * i) / platforms.length + Math.random(),
                    radius: 70 + Math.random() * 20,
                    speed: 0.008 + Math.random() * 0.006,
                    color: p.color,
                    absorbed: false,
                    opacity: 1,
                    size: 6,
                }));
            }

            setDots(localDots);
            setDataLost(localDataLost);

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dots.length === 0]);

    return (
        <div className="bg-gradient-to-br from-[#2a2336] to-gradz-charcoal text-gradz-cream rounded-[2rem] p-6 border border-deep-purple/20 h-full flex flex-col overflow-hidden">
            <div className="text-xs font-mono uppercase tracking-widest text-deep-purple mb-3">
                The Problem // Data Exploitation
            </div>
            <h3 className="text-lg font-bold mb-1">Your Data, Their Profit</h3>
            <p className="text-xs text-gradz-cream/40 mb-3">
                Watch your data spiral into big tech&apos;s gravity well — for free.
            </p>

            {/* Canvas Animation */}
            <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <canvas ref={canvasRef} className="w-[280px] h-[220px]" />
            </div>

            {/* Data Lost Counter */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-deep-purple/20">
                <span className="text-xs font-mono uppercase tracking-wider text-gradz-cream/50">
                    Data Absorbed:
                </span>
                <span className="font-mono font-bold text-clay text-lg">
                    {dataLost.toFixed(1)} <span className="text-xs text-gradz-cream/40">TB</span>
                </span>
            </div>
        </div>
    );
}
