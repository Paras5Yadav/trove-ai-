"use client";

import { motion } from "framer-motion";
import { UploadCloud, Database, Wallet, Activity, CheckCircle2 } from "lucide-react";
import { FileUploadArea } from "@/components/dashboard/FileUploadArea";
import { getUserDashboardStatsAction } from "@/app/actions/vault";
import { useEffect, useState } from "react";

export default function Dashboard() {
    const [earnings, setEarnings] = useState("0.00");
    const [totalGbs, setTotalGbs] = useState("0.00");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const result = await getUserDashboardStatsAction();
                if (result.success && result.data) {
                    setEarnings(result.data.pending_earnings);
                    setTotalGbs(result.data.total_gbs);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <main className="min-h-screen bg-gradz-cream pt-32 pb-24 px-6 sm:px-12 md:px-24">
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
                            <p className="text-gradz-cream/60 text-sm">We are actively sourcing everyday mobility data.</p>
                        </div>

                        <div className="w-full md:w-1/2 bg-white/5 rounded-2xl p-6 border border-white/10">
                            <div className="flex justify-between items-end mb-4">
                                <div className="text-sm text-gradz-cream/60 font-mono">Volume Collected</div>
                                <div className="text-xl font-bold">12.4 <span className="text-sm font-normal text-gradz-cream/60">/ 50.0 TB</span></div>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "24.8%" }}
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

                        <FileUploadArea />
                    </div>

                    {/* User Analytics Sidebar */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gradz-charcoal flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Your Analytics
                        </h3>

                        <div className="space-y-4">
                            {/* Stat 1 — Total Earnings */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-gradz-butter/30 rounded-xl">
                                        <Wallet className="w-5 h-5 text-gradz-charcoal" />
                                    </div>
                                    <div className="text-sm font-medium text-gradz-charcoal/60">Total Earnings</div>
                                </div>
                                {isLoading ? (
                                    <div className="h-10 w-32 bg-gradz-cream animate-pulse rounded-lg" />
                                ) : (
                                    <div className="text-4xl font-mono font-bold text-gradz-charcoal">${earnings}</div>
                                )}
                            </div>

                            {/* Stat 2 — Data Contributed */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-gradz-blue/30 rounded-xl">
                                        <Database className="w-5 h-5 text-gradz-charcoal" />
                                    </div>
                                    <div className="text-sm font-medium text-gradz-charcoal/60">Data Contributed</div>
                                </div>
                                {isLoading ? (
                                    <div className="h-10 w-32 bg-gradz-cream animate-pulse rounded-lg" />
                                ) : (
                                    <>
                                        <div className="text-4xl font-mono font-bold text-gradz-charcoal">{totalGbs} <span className="text-xl">GB</span></div>
                                        <div className="mt-4 w-full">
                                            <div className="flex justify-between text-[10px] font-mono text-gradz-charcoal/50 uppercase tracking-widest mb-1">
                                                <span>Your Limit</span>
                                                <span>{totalGbs} / 10 GB</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gradz-charcoal/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradz-green transition-all duration-1000 ease-out"
                                                    style={{ width: `${Math.min((parseFloat(totalGbs) / 10) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
