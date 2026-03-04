"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { DataGravityWell } from "@/components/cards/DiagnosticShuffler";
import { LiveAuctionBoard } from "@/components/cards/TelemetryTypewriter";
import { RevenueWaterfall } from "@/components/cards/EarningsTracker";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <main className="relative min-h-screen bg-gradz-cream overflow-hidden selection:bg-gradz-green/30 px-6 sm:px-12 md:px-24">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradz-matcha/20 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradz-peach/20 blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Main Content Wrapper */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto pt-32 pb-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Intro Block */}
        <motion.div variants={itemVariants} className="mb-24 md:mb-40 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#85d7ff]/20 bg-[#85d7ff]/10 text-[#85d7ff] font-medium text-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#85d7ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#85d7ff]"></span>
            </span>
            Monetize Reality
          </div>

          <h1 className="text-6xl md:text-8xl font-serif tracking-tight leading-[0.9] text-[#85d7ff] mb-8">
            <span className="text-gradz-charcoal block">Your Data</span>
            <span className="italic block pl-8 md:pl-16 relative">
              Is The
            </span>
            <span className="text-gradz-charcoal block">Algorithm.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gradz-charcoal/60 font-serif leading-relaxed max-w-xl mb-12">
            Upload your photos and videos. We sell them to AI companies and research labs training the next wave of intelligent systems — and you earn passive income every time they&apos;re used.
          </p>

          <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-gradz-charcoal">
            <button className="bg-gradz-charcoal text-gradz-cream px-8 py-4 rounded-full hover:bg-black hover:scale-105 transition-all duration-300">
              Start Uploading
            </button>
            <span className="opacity-40 ml-4 hidden sm:inline-block">Scroll to explore</span>
            <ArrowRight className="w-5 h-5 opacity-40 animate-pulse hidden sm:block" />
          </div>
        </motion.div>

        {/* Interactive Info Cards Section — DataVault Style */}
        <div className="w-screen relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] px-6 sm:px-12 md:px-24 py-16 md:py-24 bg-gradz-charcoal mb-24 md:mb-40">
          <div className="max-w-5xl mx-auto">

            {/* DataVault Style Heading */}
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[#CC5833] font-mono text-sm tracking-wider font-semibold uppercase">
                  &gt; THE DATA REVOLUTION // YOUR DATA. YOUR PROFIT.
                </span>
              </div>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-gradz-cream tracking-tight leading-[0.9]">
                THEY TAKE IT FREE.<br />
                <span className="text-[#CC5833] italic">
                  *We Pay You.*
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DataGravityWell />
              <LiveAuctionBoard />
              <RevenueWaterfall />
            </div>
          </div>
        </div>

        {/* Categories Grid -> In-Demand Assets */}
        <div className="max-w-5xl mx-auto mt-24 md:mt-40 mb-16 px-6 sm:px-0">
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[#85d7ff] font-mono text-sm tracking-wider font-semibold uppercase">
                &gt; THE CONTRIBUTOR ARCHIVE
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-gradz-charcoal tracking-tight leading-[0.9]">
              IN-DEMAND
              <br />
              <span className="text-gradz-charcoal italic">
                *Assets.*
              </span>
            </h2>
            <p className="mt-8 text-xl md:text-2xl text-gradz-charcoal/60 font-serif leading-relaxed max-w-xl">
              From breakup texts to pothole geometry. If you generate it, we want it. See what the network is actively acquiring.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative z-20">

          {/* Card 1 */}
          <motion.div variants={itemVariants} className="group relative bg-white rounded-3xl p-6 shadow-xl shadow-gradz-charcoal/5 transform hover:-translate-y-2 transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradz-butter/60 rounded-t-3xl" />
            <div className="aspect-[4/3] bg-gradz-cream border border-gradz-charcoal/5 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative group-hover:bg-gradz-butter/10 transition-colors duration-500">
              <Image src="/images/physical-world.png" alt="The Physical World" width={280} height={280} className="object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-3xl font-serif text-gradz-charcoal leading-tight mb-3">The Physical World</h3>
            <p className="text-gradz-charcoal/60 mb-6">High-definition environmental capture. Dashcam footage of potholes, 4K street walks, and 3D room scans.</p>
            <div className="flex items-center gap-2 bg-gradz-green/10 w-fit px-3 py-1.5 rounded-full mt-auto">
              <div className="w-2 h-2 rounded-full bg-gradz-green animate-pulse" />
              <span className="text-xs font-mono font-medium text-gradz-charcoal/80">Avg. $0.05 – $2.00 / upload</span>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants} className="group relative bg-white rounded-3xl p-6 shadow-xl shadow-gradz-charcoal/5 md:mt-24 transform hover:-translate-y-2 transition-all duration-500 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradz-lilac/60 rounded-t-3xl" />
            <div className="aspect-[4/3] bg-gradz-cream border border-gradz-charcoal/5 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative group-hover:bg-gradz-lilac/10 transition-colors duration-500">
              <Image src="/images/human-context.png" alt="Human Context" width={280} height={280} className="object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-3xl font-serif text-gradz-charcoal leading-tight mb-3">Human Context</h3>
            <p className="text-gradz-charcoal/60 mb-6">Authentic human interaction is the rarest asset on the internet. From search histories to breakup texts.</p>
            <div className="flex items-center gap-2 bg-gradz-green/10 w-fit px-3 py-1.5 rounded-full mt-auto">
              <div className="w-2 h-2 rounded-full bg-gradz-green animate-pulse" />
              <span className="text-xs font-mono font-medium text-gradz-charcoal/80">Avg. $0.50 – $5.00 / log</span>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants} className="group relative bg-white rounded-3xl p-6 shadow-xl shadow-gradz-charcoal/5 transform hover:-translate-y-2 transition-all duration-500 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradz-blue/60 rounded-t-3xl" />
            <div className="aspect-[4/3] bg-gradz-cream border border-gradz-charcoal/5 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative group-hover:bg-gradz-blue/10 transition-colors duration-500">
              <Image src="/images/acoustic-signatures.png" alt="Acoustic Signatures" width={280} height={280} className="object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-3xl font-serif text-gradz-charcoal leading-tight mb-3">Acoustic Signatures</h3>
            <p className="text-gradz-charcoal/60 mb-6">Uncompressed field recordings, crowded cafes, mechanical hums, and localized soundscapes.</p>
            <div className="flex items-center gap-2 bg-gradz-green/10 w-fit px-3 py-1.5 rounded-full mt-auto">
              <div className="w-2 h-2 rounded-full bg-gradz-green animate-pulse" />
              <span className="text-xs font-mono font-medium text-gradz-charcoal/80">Avg. $0.20 – $3.00 / min</span>
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div variants={itemVariants} className="group relative bg-white rounded-3xl p-6 shadow-xl shadow-gradz-charcoal/5 md:mt-24 transform hover:-translate-y-2 transition-all duration-500 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradz-peach/60 rounded-t-3xl" />
            <div className="aspect-[4/3] bg-gradz-cream border border-gradz-charcoal/5 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative group-hover:bg-gradz-peach/10 transition-colors duration-500">
              <Image src="/images/transactional-data.png" alt="Transactional Data" width={280} height={280} className="object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-3xl font-serif text-gradz-charcoal leading-tight mb-3">Transactional Data</h3>
            <p className="text-gradz-charcoal/60 mb-6">Bills, menus, retail receipts, handwritten notes—structured commercial data from the real world.</p>
            <div className="flex items-center gap-2 bg-gradz-green/10 w-fit px-3 py-1.5 rounded-full mt-auto">
              <div className="w-2 h-2 rounded-full bg-gradz-green animate-pulse" />
              <span className="text-xs font-mono font-medium text-gradz-charcoal/80">Avg. $0.10 – $1.00 / scan</span>
            </div>
          </motion.div>

        </div>

      </motion.div>
    </main>
  );
}
