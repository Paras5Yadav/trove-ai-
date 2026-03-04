"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const tiers = [
    {
        id: "contributor",
        label: "TIER 01",
        name: "THE CONTRIBUTOR",
        price: "$0",
        description: "Start monetizing your digital exhaust immediately.",
        features: [
            "Standard Marketplace Listing",
            "Monthly Payouts (Net-30)",
            "Basic Analytics Dashboard",
            "Standard Resolution Uploads"
        ],
        bg: "bg-cream",
        text: "text-charcoal",
        accent: "text-moss"
    },
    {
        id: "creator",
        label: "TIER 02",
        name: "THE CREATOR",
        price: "$29",
        period: "/mo",
        description: "Priority placement and multiplied earnings for consistent uploaders.",
        features: [
            "+40% Yield Multiplier",
            "Instant Payouts",
            "Advanced Demand Forecasting",
            "Verified Creator Badge (Priority Queue)"
        ],
        bg: "bg-moss",
        text: "text-cream",
        accent: "text-clay"
    },
    {
        id: "enterprise",
        label: "TIER 03",
        name: "THE ENTERPRISE",
        price: "Custom",
        description: "Built for data brokers, drone fleets, and massive archives.",
        features: [
            "Direct Research Lab Partnerships",
            "Custom Licensing Terms",
            "Dedicated API Access",
            "White-glove Ingestion Support"
        ],
        bg: "bg-charcoal",
        text: "text-cream",
        accent: "text-moss-light"
    },
];

export function Membership() {
    const [activeTier, setActiveTier] = useState<string>("creator");

    return (
        <section id="membership" className="py-24 md:py-32 bg-[#E8E6DD] px-4 md:px-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col gap-12 md:gap-24">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-charcoal/10 pb-12">
                    <div className="max-w-2xl">
                        <div className="font-fira-code text-clay text-[0.7rem] tracking-widest mb-6 uppercase">
                            {"> "}SYSTEM ACCESS PROTOCOLS
                        </div>
                        <h2 className="font-fraunces font-extrabold text-[clamp(2.5rem,5vw,4rem)] text-charcoal leading-[1] tracking-tight uppercase mb-2">
                            Contributor
                        </h2>
                        <h3 className="font-cormorant italic text-[clamp(3.5rem,6vw,5rem)] text-moss leading-[0.9]">
                            *Tiers.*
                        </h3>
                    </div>
                    <p className="font-epilogue font-normal text-charcoal/60 text-[1.1rem] max-w-[320px] leading-relaxed">
                        Select your access level. The exchange honors data at every scale.
                    </p>
                </div>

                {/* Cards Container */}
                <div className="flex flex-col lg:flex-row w-full h-auto lg:h-[600px] gap-6 lg:gap-4">
                    {tiers.map((tier) => {
                        const isActive = activeTier === tier.id;

                        return (
                            <div
                                key={tier.id}
                                onMouseEnter={() => setActiveTier(tier.id)}
                                className={cn(
                                    "relative rounded-[2rem] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col border border-charcoal/5",
                                    tier.bg, tier.text,
                                    "opacity-100", // Full opacity on mobile
                                    isActive ? "lg:flex-[2.5]" : "lg:flex-[1] lg:opacity-60 lg:hover:opacity-100 lg:cursor-pointer"
                                )}
                                style={{
                                    clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 32px), calc(100% - 32px) 100%, 0 100%)"
                                }}
                            >
                                {/* Collapsed State (Vertical Title on Desktop) */}
                                <div className={cn(
                                    "absolute inset-0 p-8 flex-col transition-opacity duration-500",
                                    "hidden lg:flex", // Hide entirely on mobile
                                    isActive ? "lg:opacity-0 lg:pointer-events-none" : "lg:opacity-100"
                                )}>
                                    <span className="font-fira-code text-[0.7rem] tracking-widest opacity-60 mb-8">{tier.label}</span>
                                    <h4 className={cn(
                                        "font-fraunces font-bold text-2xl tracking-widest lg:writing-vertical-rl lg:rotate-180 lg:mt-auto whitespace-nowrap",
                                        tier.id === 'enterprise' ? 'text-moss-light' : 'text-current'
                                    )}>
                                        {tier.name}
                                    </h4>
                                </div>

                                {/* Expanded State */}
                                <div className={cn(
                                    "relative w-full h-full p-8 md:p-12 flex flex-col transition-all duration-700 delay-100",
                                    "opacity-100 translate-x-0", // Always fully shown and positioned on mobile
                                    isActive ? "lg:opacity-100 lg:translate-x-0 lg:relative" : "lg:opacity-0 lg:-translate-x-12 lg:absolute"
                                )}>
                                    <div className="flex flex-col h-full lg:min-w-[280px]">
                                        <span className="font-fira-code text-[0.7rem] tracking-widest opacity-60 mb-6">{tier.label}</span>

                                        <h4 className="font-fraunces font-extrabold text-3xl md:text-4xl tracking-tight uppercase mb-4">
                                            {tier.name}
                                        </h4>

                                        <p className="font-epilogue text-[1rem] opacity-70 mb-8 lg:max-w-sm lg:h-[48px]">
                                            {tier.description}
                                        </p>

                                        <div className="font-fira-code font-bold text-4xl md:text-5xl tracking-tighter mb-10 flex items-baseline gap-1">
                                            {tier.price}
                                            {tier.period && <span className="text-xl opacity-50 font-normal">{tier.period}</span>}
                                        </div>

                                        <div className="flex flex-col gap-4 mb-12 flex-grow">
                                            {tier.features.map((feature, i) => (
                                                <div key={i} className="flex items-start gap-4">
                                                    <Check className={cn("w-5 h-5 flex-shrink-0 mt-0.5", tier.accent)} strokeWidth={3} />
                                                    <span className="font-fira-code text-[0.8rem] opacity-90 leading-relaxed uppercase">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            className={cn(
                                                "group flex items-center justify-between w-full p-4 rounded-xl border mt-auto transition-all",
                                                tier.id === 'creator'
                                                    ? "bg-clay border-clay text-cream hover:bg-clay/90"
                                                    : "border-current/20 hover:bg-current hover:text-charcoal bg-transparent"
                                            )}
                                        >
                                            <span className={cn(
                                                "font-fraunces font-bold text-[0.9rem] uppercase tracking-wider",
                                                tier.id !== 'creator' && "group-hover:text-cream"
                                            )}>
                                                {tier.id === 'enterprise' ? 'Contact Protocol' : 'Initialize'}
                                            </span>
                                            <ArrowRight className={cn(
                                                "w-5 h-5 transition-transform group-hover:translate-x-1",
                                                tier.id !== 'creator' && "group-hover:text-cream"
                                            )} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
