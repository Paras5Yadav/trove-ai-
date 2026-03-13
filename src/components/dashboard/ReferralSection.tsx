"use client";

import { useState } from "react";
import { Link2, Copy, Check, Gift } from "lucide-react";
import { godModeConfig } from "@/config/god-mode";

// Generates a consistent per-user factor between 0.90 and 1.10 from a seed string
function getUserVariationFactor(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    const normalized = (Math.abs(hash) % 1000) / 1000;
    return 0.90 + (normalized * 0.20);
}

interface ReferralSectionProps {
    referralCode: string;
    referralEarnings: string;
}

export function ReferralSection({ referralCode, referralEarnings }: ReferralSectionProps) {
    const [copied, setCopied] = useState(false);

    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://troveai.in";
    const referralLink = `${siteUrl}/auth?ref=${referralCode}`;
    const userFactor = referralCode ? getUserVariationFactor(referralCode) : 1.0;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    if (!referralCode) return null;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradz-charcoal/5 rounded-xl">
                    <Gift className="w-5 h-5 text-gradz-charcoal/70" />
                </div>
                <div>
                    <div className="text-sm font-medium text-gradz-charcoal/60">Refer & Earn</div>
                    <div className="text-xs text-gradz-charcoal/40">Earn 15% when your referrals sell data</div>
                </div>
            </div>

            <div className="text-2xl font-mono font-bold text-gradz-charcoal mb-4">
                ₹{((Number(referralEarnings) / godModeConfig.displayDivisors.default) * userFactor).toFixed(2)}
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-500 font-mono truncate">{referralLink}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className={`shrink-0 p-2.5 rounded-lg font-medium text-sm transition-all ${
                        copied
                            ? "bg-green-50 text-green-600"
                            : "bg-gradz-charcoal/5 text-gradz-charcoal/70 hover:bg-gradz-charcoal/10"
                    }`}
                    title="Copy referral link"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
