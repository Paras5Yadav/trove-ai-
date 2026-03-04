"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const demandCategories = [
    {
        id: "spatial",
        label: "[ VISUAL / SPATIAL ]",
        title: "The Physical World",
        urgency: "URGENCY: CRITICAL",
        urgencyColor: "text-clay",
        description: "High-definition environmental capture. Dashcam footage of potholes, 4K street walks, and 3D room scans. Bought by autonomous navigation labs and robotics companies.",
        shimmerDelay: 0,
    },
    {
        id: "context",
        label: "[ TEXT / BEHAVIOR ]",
        title: "Human Context",
        urgency: "URGENCY: HIGH",
        urgencyColor: "text-moss",
        description: "Authentic human interaction is the rarest asset on the internet. From your search histories to your breakup texts—it's all needed to align foundation LLMs and prevent model collapse.",
        shimmerDelay: 0.2,
    },
    {
        id: "acoustic",
        label: "[ AUDIO / AMBIENT ]",
        title: "Acoustic Signatures",
        urgency: "URGENCY: STEADY",
        urgencyColor: "text-charcoal",
        description: "Uncompressed field recordings, crowded cafes, mechanical hums, and localized soundscapes. Licensed for next-generation noise cancellation models and environmental recognition.",
        shimmerDelay: 0.4,
    }
];

function CategoryCard({ category }: { category: typeof demandCategories[0] }) {
    return (
        <div className="story-card flex flex-col bg-white border border-charcoal/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow w-full max-w-[400px]">

            {/* Top Header Section */}
            <div className="p-6 md:p-8 pb-4 flex flex-col">
                <span className="font-fira-code text-[0.7rem] text-moss mb-2">{category.label}</span>
            </div>

            {/* Title Area (Replaced Shimmer) */}
            <div className="w-full px-6 md:px-8 py-10 bg-charcoal/5 border-y border-charcoal/10 flex items-center">
                <span className="font-fraunces font-bold text-4xl leading-[1.1] text-charcoal">{category.title}</span>
            </div>

            {/* Bottom Content Section */}
            <div className="p-6 md:p-8 pt-6 flex flex-col flex-grow">

                <p className="font-epilogue text-[0.95rem] text-charcoal/70 leading-relaxed mb-8 flex-grow">
                    {category.description}
                </p>

                <div className="font-fira-code text-[0.65rem] border-t border-charcoal/10 pt-4 flex justify-between items-center">
                    <span className="text-charcoal/50">NETWORK STATUS:</span>
                    <span className={cn("font-bold tracking-wider", category.urgencyColor)}>{category.urgency}</span>
                </div>
            </div>
        </div>
    );
}

export function Stories() {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        // Animation removed as per user request
    }, []);

    return (
        <section ref={containerRef} id="demand" className="py-24 md:py-32 px-4 bg-cream relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-moss/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-clay/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <div className="w-full max-w-7xl mx-auto relative z-10">

                <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="font-fira-code text-clay text-[0.7rem] tracking-widest mb-4 uppercase">
                            {"\> "}THE CONTRIBUTOR ARCHIVE
                        </div>
                        <h2 className="font-fraunces font-extrabold text-[clamp(2.5rem,5vw,4rem)] text-charcoal leading-[1] tracking-tight mb-2">
                            IN-DEMAND
                        </h2>
                        <h3 className="font-cormorant italic text-[clamp(3.5rem,7vw,6rem)] text-moss leading-[0.9]">
                            *Assets.*
                        </h3>
                    </div>
                    <p className="font-epilogue font-normal text-charcoal/60 text-[1.1rem] max-w-[400px] leading-relaxed">
                        From breakup texts to pothole geometry. If you generate it, we want it. See what the network is actively acquiring.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-center lg:items-stretch gap-6 lg:gap-8">
                    {demandCategories.map(category => (
                        <CategoryCard key={category.id} category={category} />
                    ))}
                </div>

            </div>

        </section>
    );
}
