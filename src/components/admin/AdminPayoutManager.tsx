"use client";

import { useState } from "react";
import { PendingWithdrawal, markWithdrawalPaidAction, denyWithdrawalAction } from "@/app/actions/admin";
import { CheckCircle2, XCircle, Loader2, Banknote, Copy, Check, Clock } from "lucide-react";

interface AdminPayoutManagerProps {
    withdrawals: PendingWithdrawal[];
    totalAmount: number;
}

export function AdminPayoutManager({ withdrawals, totalAmount }: AdminPayoutManagerProps) {
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);

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
            if (reason === null) return; // User cancelled prompt
            
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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
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
                        <div className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</div>
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
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-medium text-gray-900">{req.profiles?.display_name || 'Unknown User'}</div>
                                            <div className="text-xs text-gray-500">{req.profiles?.email || 'No email provided'}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-lg font-mono font-bold text-gray-900">
                                                ${Number(req.amount).toFixed(2)}
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
