"use client";

import { useState, Fragment } from "react";
import { PendingWithdrawal, markWithdrawalPaidAction, denyWithdrawalAction, getUserWithdrawalHistoryAction } from "@/app/actions/admin";
import { CheckCircle2, XCircle, Loader2, Banknote, Copy, Check, Clock, ChevronDown, ChevronUp, History } from "lucide-react";

interface AdminPayoutManagerProps {
    withdrawals: PendingWithdrawal[];
    totalAmount: number;
}

export function AdminPayoutManager({ withdrawals, totalAmount }: AdminPayoutManagerProps) {
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [userHistory, setUserHistory] = useState<PendingWithdrawal[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const handleCopyUpi = async (upiId: string, id: string) => {
        try {
            await navigator.clipboard.writeText(upiId);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (e) {
            console.error("Failed to copy", e);
        }
    };

    const handleAction = async (requestId: string, action: "paid" | "deny") => {
        if (action === "deny") {
            const reason = window.prompt("Reason for denying this request? (Optional, user will get funds back)");
            if (reason === null) return;
            
            setProcessingIds(prev => new Set(prev).add(requestId));
            try {
                await denyWithdrawalAction(requestId, reason);
            } catch (error) {
                console.error("Failed to deny:", error);
                alert("Error denying withdrawal");
            } finally {
                setProcessingIds(prev => {
                    const next = new Set(prev);
                    next.delete(requestId);
                    return next;
                });
            }
        } else {
            if (!window.confirm("Are you sure you have manually transferred the funds to this UPI ID?")) return;
            
            setProcessingIds(prev => new Set(prev).add(requestId));
            try {
                await markWithdrawalPaidAction(requestId);
            } catch (error) {
                console.error("Failed to mark paid:", error);
                alert("Error marking withdrawal as paid");
            } finally {
                setProcessingIds(prev => {
                    const next = new Set(prev);
                    next.delete(requestId);
                    return next;
                });
            }
        }
    };

    const handleToggleHistory = async (userId: string) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
            setUserHistory([]);
            return;
        }

        setExpandedUserId(userId);
        setLoadingHistory(true);
        try {
            const res = await getUserWithdrawalHistoryAction(userId);
            if (res.success && res.data) {
                setUserHistory(res.data.withdrawals);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" /> Paid</span>;
            case 'denied':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200"><XCircle className="w-3 h-3" /> Denied</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200"><Clock className="w-3 h-3" /> Pending</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-gray-50 rounded-lg">
                        <Clock className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                        <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Pending Requests</div>
                        <div className="text-xl font-bold">{withdrawals.length}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-gray-50 rounded-lg">
                        <Banknote className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                        <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Total Amount Pending</div>
                        <div className="text-xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200">
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">UPI ID</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested On</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {withdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <CheckCircle2 className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-600">Zero pending payouts!</p>
                                            <p className="text-sm">All withdrawal requests have been processed.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                withdrawals.map((req) => (
                                    <Fragment key={req.id}>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <button 
                                                    onClick={() => handleToggleHistory(req.user_id)}
                                                    className="flex items-center gap-2 text-left hover:opacity-70 transition-opacity group"
                                                >
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{req.profiles?.display_name || 'Unknown User'}</div>
                                                        <div className="text-xs text-gray-500">{req.profiles?.email || 'No email provided'}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <History className="w-3 h-3" />
                                                        {expandedUserId === req.user_id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-lg font-mono font-bold text-gray-900">
                                                    ₹{Number(req.amount).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 w-max">
                                                    <span className="text-sm font-mono text-gray-700 select-all">{req.upi_id}</span>
                                                    <button 
                                                        onClick={() => handleCopyUpi(req.upi_id, req.id)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                                                        title="Copy UPI ID"
                                                    >
                                                        {copiedId === req.id ? <Check className="w-4 h-4 text-gray-900" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-500">
                                                {formatDate(req.created_at)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {processingIds.has(req.id) ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={() => handleAction(req.id, 'deny')}
                                                                title="Deny & Refund"
                                                                className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                                                            >
                                                                Deny
                                                            </button>
                                                            <button 
                                                                onClick={() => handleAction(req.id, 'paid')}
                                                                title="Mark as Paid"
                                                                className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-black rounded-lg transition-colors flex items-center gap-1.5"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Mark Paid
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expandable History Row */}
                                        {expandedUserId === req.user_id && (
                                            <tr key={`${req.id}-history`}>
                                                <td colSpan={5} className="px-6 py-4 bg-gray-50/50">
                                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                        <History className="w-3.5 h-3.5" />
                                                        Full Payout History — {req.profiles?.display_name}
                                                    </div>
                                                    {loadingHistory ? (
                                                        <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                                                            <Loader2 className="w-4 h-4 animate-spin" /> Loading history...
                                                        </div>
                                                    ) : userHistory.length === 0 ? (
                                                        <div className="text-sm text-gray-400 py-2">No withdrawal history found.</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {userHistory.map((h) => (
                                                                <div key={h.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                                                                    <div className="flex items-center gap-3">
                                                                        {getStatusBadge(h.status)}
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            ₹{Number(h.amount).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        {h.admin_note && (
                                                                            <span className="text-xs text-red-500 italic max-w-[200px] truncate" title={h.admin_note}>
                                                                                &quot;{h.admin_note}&quot;
                                                                            </span>
                                                                        )}
                                                                        <span className="text-xs text-gray-400">
                                                                            {formatDate(h.created_at)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
