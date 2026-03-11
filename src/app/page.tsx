"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { DataGravityWell } from "@/components/cards/DiagnosticShuffler";
import { LiveAuctionBoard } from "@/components/cards/TelemetryTypewriter";
import { RevenueWaterfall } from "@/components/cards/EarningsTracker";
import { SmartUploadButton } from "@/components/SmartUploadButton";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

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
            {t("landing.badge")}
          </div>

          <h1 className="text-6xl md:text-8xl font-serif tracking-tight leading-[0.9] text-[#85d7ff] mb-8">
            <span className="text-gradz-charcoal block">{t("landing.heroLine1")}</span>
            <span className="italic block pl-8 md:pl-16 relative">
              {t("landing.heroLine2")}
            </span>
            <span className="text-gradz-charcoal block">{t("landing.heroLine3")}</span>
          </h1>

          <p className="text-xl md:text-2xl text-gradz-charcoal/60 font-serif leading-relaxed max-w-xl mb-12">
            {t("landing.subtitle")}
          </p>

          <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-gradz-charcoal">
            <SmartUploadButton />
            <Link href="/policies" className="group flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity ml-4 hidden sm:flex">
                <span>{t("landing.reviewPolicies")}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Interactive Info Cards Section — Trove AI Style */}
        <div className="w-screen relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] px-6 sm:px-12 md:px-24 py-16 md:py-24 bg-gradz-charcoal mb-24 md:mb-40">
          <div className="max-w-5xl mx-auto">

            {/* Trove AI Style Heading */}
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[#CC5833] font-mono text-sm tracking-wider font-semibold uppercase">
                  {t("landing.sectionTag1")}
                </span>
              </div>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-gradz-cream tracking-tight leading-[0.9]">
                {t("landing.sectionHeading1a")}<br />
                <span className="text-[#CC5833] italic">
                  {t("landing.sectionHeading1b")}
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
                {t("landing.sectionTag2")}
              </span>
            </div>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-gradz-charcoal tracking-tight leading-[0.9]">
              {t("landing.sectionHeading2a")}
              <br />
              <span className="text-gradz-charcoal italic">
                {t("landing.sectionHeading2b")}
              </span>
            </h2>
            <p className="mt-8 text-xl md:text-2xl text-gradz-charcoal/60 font-serif leading-relaxed max-w-xl">
              {t("landing.sectionSubtitle2")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative z-20">

          {/* Card 1 */}
          <motion.div variants={itemVariants} className="group relative bg-white rounded-3xl p-6 shadow-xl shadow-gradz-charcoal/5 transform hover:-translate-y-2 transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradz-butter/60 rounded-t-3xl" />
            <div className="aspect-[4/3] bg-gradz-cream border border-gradz-charcoal/5 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative group-hover:bg-gradz-butter/10 transition-colors duration-500">
              <Image src="/images/physical-world.png" alt={t("landing.card1Title")} width={280} height={280} className="object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-3xl font-serif text-gradz-charcoal leading-tight mb-3">{t("landing.card1Title")}</h3>
            <p className="text-gradz-charcoal/60 mb-6">{t("landing.card1Desc")}</p>
            <div className="flex items-center gap-2 bg-gradz-green/10 w-fit px-3 py-1.5 rounded-full mt-auto">
              <div className="w-2 h-2 rounded-full bg-gradz-green animate-pulse" />
              <span className="text-xs font-mono font-medium text-gradz-charcoal/80">{t("landing.card1Tag")}</span>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={itemVariants} className="group relative bg-white rounded-3xl p-6 shadow-xl shadow-gradz-charcoal/5 md:mt-24 transform hover:-translate-y-2 transition-all duration-500 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradz-lilac/60 rounded-t-3xl" />
            <div className="aspect-[4/3] bg-gradz-cream border border-gradz-charcoal/5 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative group-hover:bg-gradz-lilac/10 transition-colors duration-500">
              <Image src="/images/human-context.png" alt={t("landing.card2Title")} width={280} height={280} className="object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-3xl font-serif text-gradz-charcoal leading-tight mb-3">{t("landing.card2Title")}</h3>
            <p className="text-gradz-charcoal/60 mb-6">{t("landing.card2Desc")}</p>
            <div className="flex items-center gap-2 bg-gradz-green/10 w-fit px-3 py-1.5 rounded-full mt-auto">
              <div className="w-2 h-2 rounded-full bg-gradz-green animate-pulse" />
              <span className="text-xs font-mono font-medium text-gradz-charcoal/80">{t("landing.card2Tag")}</span>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={itemVariants} className="group relative bg-white rounded-3xl p-6 shadow-xl shadow-gradz-charcoal/5 transform hover:-translate-y-2 transition-all duration-500 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradz-blue/60 rounded-t-3xl" />
            <div className="aspect-[4/3] bg-gradz-cream border border-gradz-charcoal/5 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative group-hover:bg-gradz-blue/10 transition-colors duration-500">
              <Image src="/images/acoustic-signatures.png" alt={t("landing.card3Title")} width={280} height={280} className="object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-3xl font-serif text-gradz-charcoal leading-tight mb-3">{t("landing.card3Title")}</h3>
            <p className="text-gradz-charcoal/60 mb-6">{t("landing.card3Desc")}</p>
            <div className="flex items-center gap-2 bg-gradz-green/10 w-fit px-3 py-1.5 rounded-full mt-auto">
              <div className="w-2 h-2 rounded-full bg-gradz-green animate-pulse" />
              <span className="text-xs font-mono font-medium text-gradz-charcoal/80">{t("landing.card3Tag")}</span>
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div variants={itemVariants} className="group relative bg-white rounded-3xl p-6 shadow-xl shadow-gradz-charcoal/5 md:mt-24 transform hover:-translate-y-2 transition-all duration-500 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradz-peach/60 rounded-t-3xl" />
            <div className="aspect-[4/3] bg-gradz-cream border border-gradz-charcoal/5 rounded-2xl mb-8 flex items-center justify-center overflow-hidden relative group-hover:bg-gradz-peach/10 transition-colors duration-500">
              <Image src="/images/transactional-data.png" alt={t("landing.card4Title")} width={280} height={280} className="object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-3xl font-serif text-gradz-charcoal leading-tight mb-3">{t("landing.card4Title")}</h3>
            <p className="text-gradz-charcoal/60 mb-6">{t("landing.card4Desc")}</p>
            <div className="flex items-center gap-2 bg-gradz-green/10 w-fit px-3 py-1.5 rounded-full mt-auto">
              <div className="w-2 h-2 rounded-full bg-gradz-green animate-pulse" />
              <span className="text-xs font-mono font-medium text-gradz-charcoal/80">{t("landing.card4Tag")}</span>
            </div>
          </motion.div>

        </div>

      </motion.div>
    </main>
  );
}
