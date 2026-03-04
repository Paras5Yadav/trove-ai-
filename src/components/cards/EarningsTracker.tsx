"use client";

import { useState, useEffect } from "react";

interface CoinDrop {
    id: number;
    x: number;
    y: number;
    targetY: number;
    landed: boolean;
    value: number;
    label: string;
    color: string;
}

const platforms = [
    { label: "Photos", value: 0.12, color: "#F7E5A9" },
    { label: "Videos", value: 3.40, color: "#FFB385" },
    { label: "Audio", value: 0.80, color: "#C6E0AC" },
    { label: "4K", value: 8.60, color: "#D9D2E9" },
    { label: "Drone", value: 2.50, color: "#C9DEF4" },
    { label: "Docs", value: 1.20, color: "#FFD4C2" },
];

let coinId = 0;

export function RevenueWaterfall() {
    const [coins, setCoins] = useState<CoinDrop[]>([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [barHeights, setBarHeights] = useState(platforms.map(() => 0));
    const [lastDrop, setLastDrop] = useState("");

    // Drop coins periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const platIdx = Math.floor(Math.random() * platforms.length);
            const platform = platforms[platIdx];

            const newCoin: CoinDrop = {
                id: coinId++,
                x: 24 + platIdx * 40,
                y: 0,
                targetY: 140 - barHeights[platIdx] * 3,
                landed: false,
                value: platform.value,
                label: platform.label,
                color: platform.color,
            };

            setCoins((prev) => [...prev.slice(-12), newCoin]);
            setLastDrop(
                `+$${platform.value.toFixed(2)} from ${platform.label}`
            );

            // Grow bar
            setBarHeights((prev) => {
                const next = [...prev];
                next[platIdx] = Math.min(next[platIdx] + 1, 35);
                return next;
            });

            // Accumulate earnings
            setTotalEarnings((prev) => prev + platform.value);
        }, 1200);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [barHeights]);

    // Animate coins falling
    useEffect(() => {
        const timeout = setTimeout(() => {
            setCoins((prev) =>
                prev.map((coin) =>
                    coin.landed ? coin : { ...coin, y: coin.targetY, landed: true }
                )
            );
        }, 100);
        return () => clearTimeout(timeout);
    }, [coins.length]);

    // Reset bars periodically
    useEffect(() => {
        const resetInterval = setInterval(() => {
            setBarHeights(platforms.map(() => 0));
        }, 20000);
        return () => clearInterval(resetInterval);
    }, []);

    return (
        <div className="bg-gradient-to-br from-[#2a2517] to-gradz-charcoal text-gradz-cream rounded-[2rem] p-6 border border-deep-gold/20 h-full flex flex-col overflow-hidden">
            <div className="text-xs font-mono uppercase tracking-widest text-deep-gold mb-3">
                The Solution // Kled Pays You
            </div>
            <h3 className="text-lg font-bold mb-1">Revenue Waterfall</h3>
            <p className="text-xs text-gradz-cream/40 mb-4">
                Every upload earns. Watch it accumulate.
            </p>

            {/* Waterfall Visualization */}
            <div className="flex-1 relative min-h-[180px] bg-white/[0.02] rounded-xl border border-white/5 p-3 overflow-hidden">
                {/* Falling coins */}
                {coins.map((coin) => (
                    <div
                        key={coin.id}
                        className="absolute transition-all duration-700 ease-out"
                        style={{
                            left: `${coin.x}px`,
                            top: `${coin.landed ? coin.targetY : coin.y}px`,
                            transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                    >
                        <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold shadow-lg"
                            style={{
                                backgroundColor: coin.color,
                                color: "#1A1A1A",
                                boxShadow: `0 0 8px ${coin.color}66`,
                            }}
                        >
                            $
                        </div>
                    </div>
                ))}

                {/* Bar chart at bottom */}
                <div className="absolute bottom-2 left-2 right-2 flex items-end gap-3 h-[100px]">
                    {platforms.map((platform, idx) => (
                        <div key={platform.label} className="flex-1 flex flex-col items-center gap-1">
                            <div
                                className="w-full rounded-t-md transition-all duration-500 relative overflow-hidden"
                                style={{
                                    height: `${barHeights[idx] * 3}px`,
                                    backgroundColor: `${platform.color}33`,
                                    minHeight: "2px",
                                }}
                            >
                                <div
                                    className="absolute inset-0 opacity-60"
                                    style={{
                                        background: `linear-gradient(to top, ${platform.color}66, ${platform.color}11)`,
                                    }}
                                />
                                {/* Shimmer */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer"
                                />
                            </div>
                            <span className="text-[8px] font-mono text-gradz-cream/40 truncate w-full text-center">
                                {platform.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Last drop notification */}
            <div className="mt-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gradz-green animate-pulse" />
                <span className="text-xs font-mono text-gradz-green/80 truncate">
                    {lastDrop || "Waiting for uploads..."}
                </span>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mt-2 pt-3 border-t border-deep-gold/20">
                <span className="text-xs font-mono uppercase tracking-wider text-gradz-cream/50">
                    Total Earned:
                </span>
                <span className="font-mono font-bold text-deep-gold text-xl">
                    ${totalEarnings.toFixed(2)}
                </span>
            </div>
        </div>
    );
}
