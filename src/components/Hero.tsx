"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const text2Ref = useRef<HTMLHeadingElement>(null);
    const text3Ref = useRef<HTMLHeadingElement>(null);
    const text4Ref = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // Step 2: Fades up
            tl.fromTo(
                text2Ref.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8 },
                0.5
            )
                // Step 3: Scales up
                .fromTo(
                    text3Ref.current,
                    { scale: 0.94, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 1 },
                )
                // Step 4: Fades in
                .fromTo(
                    text4Ref.current,
                    { y: 10, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8 },
                    2.2
                );
        }, containerRef);

        return () => {
            ctx.revert();
        };
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative w-full h-[100dvh] bg-charcoal flex"
        >

            {/* CONTENT - Full width on mobile, left 45% from md up */}
            <div className="relative z-10 w-full md:w-[45%] h-full flex flex-col justify-center px-6 sm:px-8 md:px-16 pt-20 pointer-events-auto">

                <h2 ref={text2Ref} className="opacity-0 font-epilogue font-bold text-[5vw] sm:text-[6vw] md:text-[3.5vw] lg:text-[2.8vw] xl:text-[2.8vw] text-cream tracking-tight leading-[1.2] mb-2 uppercase">
                    YOUR DATA IS THE
                </h2>

                <h1 ref={text3Ref} className="opacity-0 font-cormorant font-light italic text-[12vw] sm:text-[13vw] xl:text-[12vw] text-clay leading-[0.85] w-full block">
                    Algorithm.
                </h1>

                <p ref={text4Ref} className="opacity-0 font-fira-code font-normal text-[0.85rem] text-cream/70 w-full max-w-[650px] min-w-0 leading-[1.8] mt-10 border-l border-clay pl-6">
                    Upload your photos and videos. We sell them to AI companies and research labs training the next wave of intelligent systems — and you earn passive income every time they&apos;re used.
                </p>
            </div>
        </section>
    );
}
