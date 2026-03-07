import { getAllUsersAction, checkAdminAccess, getPendingWithdrawalsAction } from "@/app/actions/admin";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminPayoutManager } from "@/components/admin/AdminPayoutManager";
import { ShieldAlert, Users, TrendingUp, FileUp, Activity, Banknote } from "lucide-react";
import Link from 'next/link';

export const metadata = {
    title: "Admin Control | Trove AI",
};

export default async function AdminPage() {
    // 1. Server-side security check
    const isAdmin = await checkAdminAccess();

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 font-jakarta">Access Denied</h1>
                    <p className="text-gray-500 mb-6 font-medium">
                        You do not have the required permissions to access the Trove AI Admin Override terminal.
                    </p>
                    <Link href="/" className="inline-block bg-charcoal text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // 2. Fetch User Data
    const res = await getAllUsersAction();
    const users = res.success ? res.data : [];
    const error = !res.success ? res.error : null;

    // 3. Fetch Today's Stats
    const { getTodayNetworkStatsAction } = await import("@/app/actions/admin");
    const statsRes = await getTodayNetworkStatsAction();
    const todayStats = statsRes.success && statsRes.data ? statsRes.data : { totalFiles: 0, uniqueContributors: 0 };

    // 5. Fetch Pending Withdrawals
    const pendingWithdrawalsRes = await getPendingWithdrawalsAction();
    const pendingWithdrawalsData = pendingWithdrawalsRes.success && pendingWithdrawalsRes.data ? pendingWithdrawalsRes.data : { withdrawals: [], totalAmount: 0 };

    return (
        <div className="min-h-screen bg-cream text-charcoal font-sans">
            {/* Minimalist Admin Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-moss rounded-lg flex items-center justify-center">
                            <ShieldAlert className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-lg font-bold font-jakarta tracking-tight">God Mode Terminal</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                        <span>{users?.length || 0} Registered Contributors</span>
                        <a href="/dashboard" className="text-moss hover:underline">Exit to Dashboard</a>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-bold font-jakarta mb-2">User Payout Overrides</h2>
                        <p className="text-charcoal/60 max-w-2xl text-lg">
                            Take complete control over the economic engine. Override individual contributor earnings before they are permanently finalized in the smart contract.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <Users className="w-6 h-6 text-charcoal/40" />
                            </div>
                            <div>
                                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Total Network</div>
                                <div className="text-2xl font-bold">{users?.length || 0}</div>
                            </div>
                        </div>

                        <div className="bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <FileUp className="w-6 h-6 text-charcoal/40" />
                            </div>
                            <div>
                                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Uploads Today</div>
                                <div className="text-2xl font-bold">{todayStats.totalFiles}</div>
                            </div>
                        </div>

                        <div className="bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Activity className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-xs uppercase font-bold text-blue-400/80 tracking-wider mb-1">Active Today</div>
                                <div className="text-2xl font-bold text-blue-900">{todayStats.uniqueContributors}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-200 font-medium">
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-12">
                        {/* Payout Management Table */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2 font-jakarta">
                                <Banknote className="w-5 h-5 text-green-600" />
                                Payout Management
                            </h3>
                            <AdminPayoutManager
                                withdrawals={pendingWithdrawalsData.withdrawals}
                                totalAmount={pendingWithdrawalsData.totalAmount}
                            />
                        </div>

                        {/* Users Override Table */}
                        <div className="space-y-4 pt-8 border-t border-gray-200">
                            <h3 className="text-xl font-bold flex items-center gap-2 font-jakarta">
                                <TrendingUp className="w-5 h-5 text-moss" />
                                Individual Earning Modifications
                            </h3>
                            <AdminUsersTable users={users || []} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
