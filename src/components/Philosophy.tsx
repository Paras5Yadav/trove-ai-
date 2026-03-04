"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function Philosophy() {
    const containerRef = useRef<HTMLElement>(null);
    const panel1Ref = useRef<HTMLDivElement>(null);
    const panel2Ref = useRef<HTMLDivElement>(null);
    const panel3Ref = useRef<HTMLDivElement>(null);
    const brushRef = useRef<SVGPathElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Create a master timeline for the scroll sequence
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "+=300%", // 3 full viewport scrolls
                    scrub: 1,
                    pin: true,
                    anticipatePin: 1,
                }
            });

            // Initially show Panel 1, hide others
            gsap.set(panel2Ref.current, { y: 100, opacity: 0 });
            gsap.set(panel3Ref.current, { y: 100, opacity: 0 });

            // Stage 1: Fade out Panel 1, bring in Panel 2
            tl.to(panel1Ref.current, {
                y: -100,
                opacity: 0,
                duration: 1,
            })
                .to(panel2Ref.current, {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                }, "<") // Start at same time

                // Animate the brush stroke and Fira Code lines in Panel 2
                .to(brushRef.current, {
                    strokeDashoffset: 0,
                    duration: 0.8,
                    ease: "power2.out"
                }, "+=0.2")
                .fromTo(".p2-bullet",
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, stagger: 0.2, duration: 0.6 },
                    "-=0.4"
                )

                // Stage 2: Fade out Panel 2, bring in Panel 3
                .to(panel2Ref.current, {
                    y: -100,
                    opacity: 0,
                    duration: 1,
                }, "+=1") // Wait a bit before transitioning
                .to(panel3Ref.current, {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                }, "<");

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative w-full h-[100dvh] bg-cream overflow-hidden">

            {/* Panel 1 */}
            <div
                ref={panel1Ref}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
            >
                <span className="font-fraunces font-extrabold text-[1rem] text-moss tracking-[0.15em] mb-4 uppercase">
                    Big Tech Has Always Known:
                </span>
                <h2 className="font-cormorant italic font-light text-[clamp(5rem,11vw,10rem)] text-charcoal/20 leading-[0.9] mb-12">
                    *Your data is priceless.*
                </h2>
                <div className="w-[120px] h-[1px] bg-charcoal mx-auto" />
            </div>

            {/* Panel 2 */}
            <div
                ref={panel2Ref}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none"
            >
                <span className="font-fraunces font-extrabold text-[1rem] text-clay tracking-widest mb-4 uppercase">
                    Trove AI Ensures:
                </span>

                <div className="relative inline-block mb-12">
                    <h2 className="font-cormorant italic font-medium text-[clamp(6rem,13vw,12rem)] text-moss leading-[0.9] relative z-10">
                        *You get paid.*
                    </h2>
                    {/* Hand drawn clay underline SVG */}
                    <svg className="absolute -bottom-8 left-0 w-full h-12 z-0" preserveAspectRatio="none" viewBox="0 0 400 30">
                        <path
                            ref={brushRef}
                            d="M10,20 Q100,30 200,15 T390,25"
                            fill="none"
                            stroke="var(--color-clay)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            style={{ strokeDasharray: 600, strokeDashoffset: 600 }}
                        />
                    </svg>
                </div>

                <div className="flex flex-col gap-3 font-fira-code text-[0.85rem] text-clay/60 uppercase tracking-widest mt-8">
                    <div className="p2-bullet opacity-0">CONTRIBUTOR CONSENT LOCKED</div>
                    <div className="p2-bullet opacity-0">DATA LICENSED FAIRLY</div>
                    <div className="p2-bullet opacity-0">PAYMENT INSTANT</div>
                </div>
            </div>

            {/* Panel 3 */}
            <div
                ref={panel3Ref}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none"
            >
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-12 opacity-40 scale-90">
                    <h3 className="font-cormorant italic font-light text-4xl md:text-5xl text-charcoal">
                        *Your data is priceless.*
                    </h3>
                    <div className="hidden md:block w-[1px] h-[40px] bg-clay" />
                    <h3 className="font-cormorant italic font-medium text-4xl md:text-5xl text-moss">
                        *You get paid.*
                    </h3>
                </div>

                <p className="font-epilogue font-normal text-[1.2rem] text-charcoal/60 max-w-[560px] leading-relaxed mb-12">
                    This is not charity. It is the correction of a decade-long imbalance. Your data built the AI revolution. Now <span className="font-cormorant italic text-moss text-2xl">*share*</span> in what it created.
                </p>

                <button className="group pointer-events-auto flex items-center gap-2 font-fraunces font-semibold text-moss transition-colors hover:text-charcoal bg-moss/5 px-6 py-3 rounded-full hover:bg-moss/10">
                    Read our Contributor Manifesto
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-2" />
                </button>
            </div>

        </section>
    );
}
