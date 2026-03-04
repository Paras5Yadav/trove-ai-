"use client";

import { motion, Variants } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Philosophy } from "@/components/Philosophy";
import { Protocol } from "@/components/Protocol";
import { Membership } from "@/components/Membership";
import { Stories } from "@/components/Stories";
import { Footer } from "@/components/Footer";

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
    <main className="min-h-screen bg-moss text-cream selection:bg-clay selection:text-cream overflow-hidden">
      <Navbar />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={itemVariants}>
          <Hero />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Features />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Philosophy />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Protocol />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Membership />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Stories />
        </motion.div>
      </motion.div>

      <Footer />
    </main>
  );
}
