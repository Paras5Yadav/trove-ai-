"use client";

import { motion } from "framer-motion";
import { UploadCloud, Database, Wallet, Activity, CheckCircle2 } from "lucide-react";
import { FileUploadArea } from "@/components/dashboard/FileUploadArea";
import { getUserDashboardStatsAction, getBatchVolumeAction } from "@/app/actions/vault";

import { useEffect, useState } from "react";
import { WithdrawModal } from "@/components/dashboard/WithdrawModal";
import { ReferralSection } from "@/components/dashboard/ReferralSection";
import { Clock, HelpCircle } from "lucide-react";

const BASE_TB = 12.4; // Starting base volume
const TOTAL_CAPACITY_TB = 50.0; // Total batch capacity

export default function Dashboard() {
    // New stats state based on updated architecture
    const [pendingEarnings, setPendingEarnings] = useState("0.00");
    const [withdrawable, setWithdrawable] = useState("0.00");
    const [referralEarnings, setReferralEarnings] = useState("0.00");
    const [totalGbs, setTotalGbs] = useState("0.00");
    const [totalFiles, setTotalFiles] = useState(0);
    const [referralCode, setReferralCode] = useState("");
    
    const [batchVolumeTB, setBatchVolumeTB] = useState(BASE_TB);
    const [isLoading, setIsLoading] = useState(true);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [statsResult, volumeResult] = await Promise.all([
                    getUserDashboardStatsAction(),
                    getBatchVolumeAction(),
                ]);

                if (statsResult.success && statsResult.data) {
                    setPendingEarnings(statsResult.data.pending_review_value);
                    setWithdrawable(statsResult.data.withdrawable_balance);
                    setReferralEarnings(statsResult.data.referral_earnings);
                    setTotalGbs(statsResult.data.total_gbs);
                    setTotalFiles(statsResult.data.total_files_count);
                    setReferralCode(statsResult.data.referral_code);
                }

                if (volumeResult.success && volumeResult.data) {
                    // Add real uploads on top of the 12.4 TB base
                    setBatchVolumeTB(BASE_TB + volumeResult.data.totalTB);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    const volumeDisplay = batchVolumeTB >= 1 ? `${batchVolumeTB.toFixed(1)}` : `${(batchVolumeTB * 1024).toFixed(0)} GB`;
    const progressPercent = Math.min((batchVolumeTB / TOTAL_CAPACITY_TB) * 100, 100).toFixed(1);

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
                                <div className="text-xl font-bold">{volumeDisplay} <span className="text-sm font-normal text-gradz-cream/60">/ {TOTAL_CAPACITY_TB.toFixed(1)} TB</span></div>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
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
                            {/* In Review Earnings */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradz-charcoal/5 rounded-xl">
                                            <Clock className="w-5 h-5 text-gradz-charcoal/70" />
                                        </div>
                                        <div className="text-sm font-medium text-gradz-charcoal/60 leading-tight">
                                            In Review <br />
                                            <span className="text-xs font-normal opacity-70">Pending Verification</span>
                                        </div>
                                    </div>
                                    <div className="group relative cursor-help">
                                        <HelpCircle className="w-4 h-4 text-gradz-charcoal/25 mt-1" />
                                        <div className="absolute right-0 w-48 p-3 bg-gray-900 text-white text-[11px] leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 bottom-full mb-2 shadow-xl whitespace-normal break-words">
                                            These funds will become available for withdrawal once the system verifies your files for authenticity and quality.
                                        </div>
                                    </div>
                                </div>
                                {isLoading ? (
                                    <div className="h-10 w-32 bg-gradz-charcoal/5 animate-pulse rounded-lg" />
                                ) : (
                                    <div className="text-3xl font-mono font-bold text-gradz-charcoal">${pendingEarnings}</div>
                                )}
                            </div>

                            {/* Available to Withdraw */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-gradz-charcoal/5 rounded-xl">
                                            <Wallet className="w-5 h-5 text-gradz-charcoal/70" />
                                        </div>
                                        <div className="text-sm font-medium text-gradz-charcoal/60 leading-tight">
                                            Cleared Balance <br />
                                            <span className="text-xs font-normal opacity-70">Available to Withdraw</span>
                                        </div>
                                    </div>
                                    {isLoading ? (
                                        <div className="h-10 w-32 bg-gradz-charcoal/5 animate-pulse rounded-lg mb-4" />
                                    ) : (
                                        <div className="flex items-end justify-between gap-4 mb-4">
                                            <div className="text-4xl font-mono font-bold text-gradz-charcoal">${withdrawable}</div>
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => setIsWithdrawModalOpen(true)}
                                        disabled={isLoading || parseFloat(withdrawable) <= 0}
                                        className="w-full py-2.5 bg-gradz-charcoal hover:bg-gradz-charcoal/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        Withdraw via UPI
                                    </button>
                                </div>
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
                                        <div className="mt-2 text-sm text-gradz-charcoal/60 font-medium">
                                            Batch Files: <span className="text-gradz-charcoal font-bold">{totalFiles}</span>
                                        </div>
                                        
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
                            
                            {/* Referral Section */}
                            {!isLoading && referralCode && (
                                <ReferralSection 
                                    referralCode={referralCode} 
                                    referralEarnings={referralEarnings} 
                                />
                            )}
                        </div>
                    </div>

                </div>
            </div>
            
            <WithdrawModal 
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                maxAmount={parseFloat(withdrawable)}
            />
        </main>
    );
}
