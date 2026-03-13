"use client";

import { motion } from "framer-motion";
import { UploadCloud, Database, Wallet, Activity, CheckCircle2, Banknote, Clock, XCircle } from "lucide-react";
import { MissionsDashboard } from "@/components/dashboard/MissionsDashboard";
import { getUserDashboardStatsAction, getBatchVolumeAction } from "@/app/actions/vault";

import { useEffect, useState } from "react";

import { ReferralSection } from "@/components/dashboard/ReferralSection";
import { WithdrawModal } from "@/components/dashboard/WithdrawModal";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const BASE_TB = 12.4; // Starting base volume
const TOTAL_CAPACITY_TB = 50.0; // Total batch capacity

// Generates a consistent per-user factor between 0.90 and 1.10 from a seed string
function getUserVariationFactor(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    // Normalize to 0-1 range, then scale to 0.90 - 1.10
    const normalized = (Math.abs(hash) % 1000) / 1000;
    return 0.90 + (normalized * 0.20); // ±10% range
}

export default function Dashboard() {
    const { t } = useTranslation();
    const [assetValue, setAssetValue] = useState("0.00");
    const [referralEarnings, setReferralEarnings] = useState("0.00");
    const [totalGbs, setTotalGbs] = useState("0.00");
    const [totalFiles, setTotalFiles] = useState(0);
    const [referralCode, setReferralCode] = useState("");
    const [withdrawableBalance, setWithdrawableBalance] = useState("0.00");
    const [savedUpiId, setSavedUpiId] = useState("");
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    interface DashboardWithdrawal {
        id: string;
        amount: number;
        status: string;
        admin_note: string | null;
        created_at: string;
        paid_at: string | null;
    }
    const [recentWithdrawals, setRecentWithdrawals] = useState<DashboardWithdrawal[]>([]);
    
    const [batchVolumeTB, setBatchVolumeTB] = useState(BASE_TB);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [statsResult, volumeResult] = await Promise.all([
                    getUserDashboardStatsAction(),
                    getBatchVolumeAction(),
                ]);

                if (statsResult.success && statsResult.data) {
                    setAssetValue(statsResult.data.asset_value);
                    setReferralEarnings(statsResult.data.referral_earnings);
                    setTotalGbs(statsResult.data.total_gbs);
                    setTotalFiles(statsResult.data.total_files_count);
                    setReferralCode(statsResult.data.referral_code);
                    setWithdrawableBalance(statsResult.data.withdrawable_balance);
                    setSavedUpiId(statsResult.data.upi_id || "");
                    setRecentWithdrawals(statsResult.data.recent_withdrawals || []);
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

    // Per-user variation factor for display values (±10% based on referral code)
    const userFactor = referralCode ? getUserVariationFactor(referralCode) : 1.0;

    return (
        <main className="min-h-screen bg-gradz-cream pt-32 pb-24 px-6 sm:px-12 md:px-24">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header Section */}
                <div>
                    <h1 className="text-4xl md:text-5xl font-serif text-gradz-charcoal mb-2">{t("dashboard.welcomeBack")}</h1>
                    <p className="text-gradz-charcoal/60">{t("dashboard.subtitle")}</p>
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
                                <span className="text-xs font-mono font-medium text-gradz-green uppercase tracking-wider">{t("dashboard.platformStatus")}</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-1">{t("dashboard.currentBatch")}</h2>
                            <p className="text-gradz-cream/60 text-sm">{t("dashboard.batchDesc")}</p>
                        </div>

                        <div className="w-full md:w-1/2 bg-white/5 rounded-2xl p-6 border border-white/10">
                            <div className="flex justify-between items-end mb-4">
                                <div className="text-sm text-gradz-cream/60 font-mono">{t("dashboard.volumeCollected")}</div>
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

                <div className="flex flex-col gap-12">

                    {/* Main Upload Area */}
                    <div className="w-full space-y-6">
                        <h3 className="text-xl font-bold text-gradz-charcoal flex items-center gap-2">
                            <UploadCloud className="w-5 h-5" />
                            {t("dashboard.uploadData")}
                        </h3>

                        <MissionsDashboard referralCode={referralCode} />
                    </div>

                    {/* User Analytics Sidebar */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gradz-charcoal flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            {t("dashboard.yourAnalytics")}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Asset Value Earnings */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradz-butter/30 rounded-xl">
                                            <Wallet className="w-5 h-5 text-gradz-charcoal" />
                                        </div>
                                        <div className="text-sm font-medium text-gradz-charcoal/60">{t("dashboard.assetValue")}</div>
                                    </div>
                                    <div className="group relative cursor-help outline-none" tabIndex={0}>
                                        <HelpCircle className="w-4 h-4 text-gradz-charcoal/25 mt-1" />
                                        <div className="absolute right-0 w-48 p-3 bg-gray-900 text-white text-[11px] leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible group-focus:opacity-100 group-focus:visible active:opacity-100 active:visible transition-all z-10 bottom-full mb-2 shadow-xl whitespace-normal break-words pointer-events-none group-focus:pointer-events-auto">
                                            {t("dashboard.assetTooltip")}
                                        </div>
                                    </div>
                                </div>
                                {isLoading ? (
                                    <div className="h-10 w-32 bg-gradz-charcoal/5 animate-pulse rounded-lg" />
                                ) : (
                                    <div className="text-4xl font-mono font-bold text-gradz-charcoal">
                                        ₹{isNaN(parseFloat(assetValue)) ? "0.00" : ((parseFloat(assetValue) / 6) * userFactor).toFixed(2)}
                                    </div>
                                )}
                            </div>

                            {/* Stat 2 — Data Contributed */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-gradz-blue/30 rounded-xl">
                                        <Database className="w-5 h-5 text-gradz-charcoal" />
                                    </div>
                                    <div className="text-sm font-medium text-gradz-charcoal/60">{t("dashboard.dataContributed")}</div>
                                </div>
                                {isLoading ? (
                                    <div className="h-10 w-32 bg-gradz-cream animate-pulse rounded-lg" />
                                ) : (
                                    <>
                                        <div className="text-4xl font-mono font-bold text-gradz-charcoal">{totalGbs} <span className="text-xl">GB</span></div>
                                        <div className="mt-2 text-sm text-gradz-charcoal/60 font-medium">
                                            {t("dashboard.batchFiles")}: <span className="text-gradz-charcoal font-bold">{totalFiles}</span>
                                        </div>
                                        
                                        <div className="mt-4 w-full">
                                            <div className="flex justify-between text-[10px] font-mono text-gradz-charcoal/50 uppercase tracking-widest mb-1">
                                                <span>{t("dashboard.yourLimit")}</span>
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
                            
                            {/* Available to Withdraw */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gradz-charcoal/5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradz-charcoal/10 rounded-xl shrink-0">
                                            <Banknote className="w-5 h-5 text-gradz-charcoal" />
                                        </div>
                                        <div className="text-sm font-medium text-gradz-charcoal/60">{t("dashboard.availableToWithdraw")}</div>
                                    </div>

                                </div>
                                {isLoading ? (
                                    <div className="h-10 w-32 bg-gradz-charcoal/5 animate-pulse rounded-lg" />
                                ) : (
                                    <>
                                        <div className="text-4xl font-mono font-bold text-gradz-charcoal">₹{withdrawableBalance}</div>
                                        {savedUpiId && (
                                            <div className="mt-2 text-xs text-gradz-charcoal/50 font-mono truncate">
                                                UPI: {savedUpiId}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setShowWithdrawModal(true)}
                                            disabled={parseFloat(withdrawableBalance) <= 0}
                                            className="mt-4 w-full py-2.5 bg-gradz-charcoal hover:bg-gradz-charcoal/90 text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <Banknote className="w-4 h-4" />
                                            {t("dashboard.withdrawViaUPI")}
                                        </button>
                                        <div className="text-center mt-3 text-[10px] text-gray-400 font-medium">
                                            (This is the value of your data that has been successfully sold.)
                                        </div>
                                        
                                        {/* Withdrawal Status Banner */}
                                        {recentWithdrawals.length > 0 && recentWithdrawals[0].status === 'pending' && (
                                            <div className="mt-5 p-3.5 rounded-xl bg-yellow-50/80 border border-yellow-200/60">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-sm font-semibold text-yellow-800">{t("dashboard.withdrawalPending")}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-yellow-800">
                                                        ₹{Number(recentWithdrawals[0].amount).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-yellow-600/70 mt-1">
                                                    Requested {new Date(recentWithdrawals[0].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )}
                                        {recentWithdrawals.length > 0 && recentWithdrawals[0].status === 'paid' && (
                                            <div className="mt-5 p-3.5 rounded-xl bg-green-50/80 border border-green-200/60">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-semibold text-green-800">{t("dashboard.withdrawalPaid")}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-green-800">
                                                        ₹{Number(recentWithdrawals[0].amount).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-green-600/70 mt-1">
                                                    Paid on {new Date(recentWithdrawals[0].paid_at || recentWithdrawals[0].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )}
                                        {recentWithdrawals.length > 0 && recentWithdrawals[0].status === 'denied' && (
                                            <div className="mt-5 p-3.5 rounded-xl bg-red-50/80 border border-red-200/60">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                        <span className="text-sm font-semibold text-red-800">{t("dashboard.withdrawalDenied")}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-red-800">
                                                        ₹{Number(recentWithdrawals[0].amount).toFixed(2)}
                                                    </span>
                                                </div>
                                                {recentWithdrawals[0].admin_note && (
                                                    <div className="text-xs text-red-600 mt-1.5">{recentWithdrawals[0].admin_note}</div>
                                                )}
                                                <div className="text-[11px] text-red-400 mt-1">{t("dashboard.fundsRefunded")}</div>
                                            </div>
                                        )}
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

            {/* Withdraw Modal */}
            <WithdrawModal
                isOpen={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
                maxAmount={parseFloat(withdrawableBalance)}
                savedUpiId={savedUpiId}
            />

        </main>
    );
}
