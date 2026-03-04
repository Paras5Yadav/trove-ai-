"use client";

import { useState, useEffect } from "react";

interface DataRow {
    type: string;
    price: number;
    prevPrice: number;
    flash: "up" | "down" | null;
}

const initialData: DataRow[] = [
    { type: "Street Photos", price: 0.12, prevPrice: 0.12, flash: null },
    { type: "4K Video Clip", price: 3.40, prevPrice: 3.40, flash: null },
    { type: "Drone Aerial", price: 8.60, prevPrice: 8.60, flash: null },
    { type: "Voice Recording", price: 0.80, prevPrice: 0.80, flash: null },
    { type: "Dashcam Footage", price: 2.50, prevPrice: 2.50, flash: null },
    { type: "Egocentric Clip", price: 1.20, prevPrice: 1.20, flash: null },
];

// Mini sparkline data
const generateSparkline = () =>
    Array.from({ length: 20 }, () => 20 + Math.random() * 60);

export function LiveAuctionBoard() {
    const [data, setData] = useState<DataRow[]>(initialData);
    const [sparklines, setSparklines] = useState<number[][]>(
        initialData.map(() => Array(20).fill(50))
    );
    const [mounted, setMounted] = useState(false);
    const [tickerOffset, setTickerOffset] = useState(0);

    // Initialize sparklines client-side only
    useEffect(() => {
        setSparklines(initialData.map(() => generateSparkline()));
        setMounted(true);
    }, []);

    // Price ticker updates
    useEffect(() => {
        if (!mounted) return;
        const interval = setInterval(() => {
            setData((prev) =>
                prev.map((row) => {
                    const change = (Math.random() - 0.4) * 0.3;
                    const newPrice = Math.max(0.01, row.price + change);
                    return {
                        ...row,
                        prevPrice: row.price,
                        price: parseFloat(newPrice.toFixed(2)),
                        flash: newPrice > row.price ? "up" : newPrice < row.price ? "down" : null,
                    };
                })
            );

            // Update sparklines
            setSparklines((prev) =>
                prev.map((line) => {
                    const next = [...line.slice(1), 20 + Math.random() * 60];
                    return next;
                })
            );
        }, 2000);

        return () => clearInterval(interval);
    }, [mounted]); // Add mounted to dependencies to re-run when it becomes true

    // Clear flash
    useEffect(() => {
        if (!mounted) return;
        const timeout = setTimeout(() => {
            setData((prev) => prev.map((row) => ({ ...row, flash: null })));
        }, 600);
        return () => clearTimeout(timeout);
    }, [data, mounted]); // Add mounted to dependencies

    // Ticker scroll
    useEffect(() => {
        const interval = setInterval(() => {
            setTickerOffset((prev) => prev - 1);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const renderSparkline = (points: number[], idx: number) => {
        const w = 80;
        const h = 30;
        const path = points
            .map((p, i) => `${(i / (points.length - 1)) * w},${h - (p / 100) * h}`)
            .join(" L ");

        const trendUp = points[points.length - 1] > points[points.length - 2];

        return (
            <svg key={idx} width={w} height={h} className="overflow-visible">
                <defs>
                    <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={trendUp ? "#C6E0AC" : "#CC5833"} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={trendUp ? "#C6E0AC" : "#CC5833"} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M ${path}`}
                    fill="none"
                    stroke={trendUp ? "#C6E0AC" : "#CC5833"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={`M 0,${h} L ${path} L ${w},${h} Z`}
                    fill={`url(#grad-${idx})`}
                />
            </svg>
        );
    };

    const tickerItems = data
        .map(
            (d) =>
                `${d.type}: $${d.price.toFixed(2)} ${d.price > d.prevPrice ? "▲" : d.price < d.prevPrice ? "▼" : "—"}`
        )
        .join("   •   ");

    return (
        <div className="bg-gradient-to-br from-[#1a2a3a] to-gradz-charcoal text-gradz-cream rounded-[2rem] p-6 border border-deep-teal/20 h-full flex flex-col overflow-hidden">
            <div className="text-xs font-mono uppercase tracking-widest text-deep-teal mb-3">
                The Revelation // Hidden Value
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-3">
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradz-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gradz-green" />
                </div>
                <span className="text-xs font-mono text-gradz-green/80 uppercase tracking-wider">
                    Live Market
                </span>
            </div>

            <h3 className="text-lg font-bold mb-4">
                Your Data Has Value <span className="inline-block w-2 h-2 rounded-full bg-clay" />
            </h3>

            {/* Auction Rows */}
            <div className="space-y-1.5 flex-1">
                {data.map((row, idx) => (
                    <div
                        key={row.type}
                        className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-300 ${row.flash === "up"
                            ? "bg-gradz-green/10"
                            : row.flash === "down"
                                ? "bg-clay/10"
                                : "bg-white/[0.02]"
                            }`}
                    >
                        <span className="text-xs font-medium w-24 truncate">{row.type}</span>
                        <div className="flex-1 mx-2 flex justify-center">
                            {renderSparkline(sparklines[idx], idx)}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span
                                className={`font-mono text-sm font-bold transition-colors duration-300 ${row.flash === "up"
                                    ? "text-gradz-green"
                                    : row.flash === "down"
                                        ? "text-clay"
                                        : "text-gradz-cream/80"
                                    }`}
                            >
                                ${row.price.toFixed(2)}
                            </span>
                            <span
                                className={`text-[10px] transition-all duration-300 ${row.price > row.prevPrice
                                    ? "text-gradz-green"
                                    : row.price < row.prevPrice
                                        ? "text-clay"
                                        : "text-gradz-cream/30"
                                    }`}
                            >
                                {row.price > row.prevPrice ? "▲" : row.price < row.prevPrice ? "▼" : "—"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Scrolling Ticker */}
            <div className="mt-3 pt-3 border-t border-deep-teal/20 overflow-hidden">
                <div
                    className="whitespace-nowrap font-mono text-[10px] text-gradz-cream/40"
                    style={{ transform: `translateX(${tickerOffset % 600}px)` }}
                >
                    {tickerItems}   •   {tickerItems}
                </div>
            </div>
        </div>
    );
}
