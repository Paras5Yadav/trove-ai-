"use client";

import { motion } from "framer-motion";
import { UploadCloud, Database, Wallet, Activity, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getUserDashboardStatsAction } from "@/app/actions/vault";
import { godModeConfig } from "@/config/god-mode";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Dashboard() {
    const [isDragging, setIsDragging] = useState(false);
    const [stats, setStats] = useState({ total_gbs: "0.00", pending_earnings: "0.00" });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await getUserDashboardStatsAction();
                if (res.success && res.data) {
                    setStats(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    // Global config overrides
    const displayBatchName = godModeConfig.currentBatch.name;
    const batchCapacity = godModeConfig.currentBatch.totalCapacityText;
    const batchProgressText = godModeConfig.currentBatch.overrideBatchProgress
        ? godModeConfig.currentBatch.manualCapacityFilledPercentage
        : "0%";

    return (
        <main className="min-h-screen bg-gradz-cream text-gradz-charcoal selection:bg-gradz-green/30 relative overflow-hidden">
            {/* We can reuse the DataVault Navbar but force it to look right against cream bg if needed */}
            <Navbar />

            <div className="pt-32 pb-24 px-6 sm:px-12 md:px-24">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Header Section */}
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif text-gradz-charcoal mb-2">Welcome back, Contributor.</h1>
                        <p className="text-gradz-charcoal/60">Your data is powering the next generation of AI.</p>
                    </div>

                    {/* Global Batch Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradz-charcoal text-gradz-cream rounded-3xl p-8 relative overflow-hidden"
                    >
                        {/* Decorative background grid */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-gradz-green animate-pulse" />
                                    <span className="text-xs font-mono font-medium text-gradz-green uppercase tracking-wider">Platform Status</span>
                                </div>
                                <h2 className="text-2xl font-bold mb-1">Current Training Batch</h2>
                                <p className="text-gradz-cream/60 text-sm">We are actively sourcing {displayBatchName}</p>
                            </div>

                            <div className="w-full md:w-1/2 bg-white/5 rounded-2xl p-6 border border-white/10">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="text-sm text-gradz-cream/60 font-mono">Volume Collected</div>
                                    <div className="text-xl font-bold">{batchProgressText} <span className="text-sm font-normal text-gradz-cream/60">/ {batchCapacity}</span></div>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: batchProgressText }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradz-green rounded-full relative"
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Upload Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xl font-bold text-gradz-charcoal flex items-center gap-2">
                                <UploadCloud className="w-5 h-5" />
                                Upload Data
                            </h3>

                            <motion.div
                                className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-colors duration-300 ${isDragging ? "border-gradz-green bg-gradz-green/5" : "border-gradz-charcoal/20 bg-white"} min-h-[400px]`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
                                whileHover={{ scale: 0.99 }}
                            >
                                <div className="w-20 h-20 bg-gradz-cream rounded-full flex items-center justify-center mb-6 shadow-sm border border-gradz-charcoal/5">
                                    <UploadCloud className="w-10 h-10 text-gradz-charcoal/40" />
                                </div>
                                <h4 className="text-2xl font-bold text-gradz-charcoal mb-2">Drag & drop files here</h4>
                                <p className="text-gradz-charcoal/60 max-w-sm mb-8">
                                    Supported formats: PNG, JPG, MP4, WAV, PDF.
                                    <br />Max file size: 50MB.
                                </p>
                                <button className="bg-gradz-charcoal text-gradz-cream px-8 py-4 rounded-full font-medium hover:bg-black transition-colors hover:scale-105 transform duration-200">
                                    Browse Files
                                </button>
                            </motion.div>
                        </div>

                        {/* User Analytics Sidebar */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gradz-charcoal flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Your Analytics
                            </h3>

                            <div className="space-y-4">
                                {/* Stat 1 */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-gradz-butter/30 rounded-xl">
                                            <Wallet className="w-5 h-5 text-gradz-charcoal" />
                                        </div>
                                        <div className="text-sm font-medium text-gradz-charcoal/60">Total Earnings</div>
                                    </div>
                                    <div className="text-4xl font-mono font-bold text-gradz-charcoal">
                                        ${isLoading ? "..." : stats.pending_earnings}
                                    </div>
                                </div>

                                {/* Stat 2 */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-gradz-blue/30 rounded-xl">
                                            <Database className="w-5 h-5 text-gradz-charcoal" />
                                        </div>
                                        <div className="text-sm font-medium text-gradz-charcoal/60">Data Contributed</div>
                                    </div>
                                    <div className="text-4xl font-mono font-bold text-gradz-charcoal">
                                        {isLoading ? "..." : stats.total_gbs} <span className="text-xl">GB</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gradz-charcoal/60">
                                        <CheckCircle2 className="w-4 h-4 text-gradz-green" />
                                        Active contributions
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
