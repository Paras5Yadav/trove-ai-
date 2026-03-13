"use client";

import React, { useState } from "react";
import { AdminUserStats, setAdminOverrideEarningsAction, toggleUserApprovalAction, PendingWithdrawal, getUserWithdrawalHistoryAction } from "@/app/actions/admin";
import { Search, Loader2, DollarSign, Check, X, Database, Banknote, CheckCircle2, XCircle, FilePlus, ShieldCheck, Edit2, Users, History, Clock } from "lucide-react";
import { godModeConfig } from "@/config/god-mode";

export function AdminUsersTable({ users }: { users: AdminUserStats[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [localUsers, setLocalUsers] = useState<AdminUserStats[]>(users);
    const [expandedRefsUserId, setExpandedRefsUserId] = useState<string | null>(null);
    const [expandedHistoryUserId, setExpandedHistoryUserId] = useState<string | null>(null);
    const [userHistory, setUserHistory] = useState<PendingWithdrawal[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const handleEditClick = (user: AdminUserStats) => {
        setEditingUserId(user.id);
        setEditValue(user.admin_override_earnings != null ? user.admin_override_earnings.toString() : "");
    };

    const handleCancel = () => {
        setEditingUserId(null);
        setEditValue("");
    };

    const handleSave = async (userId: string) => {
        setIsSaving(true);
        // Call Server Action
        const res = await setAdminOverrideEarningsAction(userId, editValue || null);

        if (res.success) {
            // Optimistically update local UI
            setLocalUsers(prev => prev.map(u =>
                u.id === userId
                    ? { ...u, admin_override_earnings: editValue || null }
                    : u
            ));
        } else {
            setActionError(res.error || "Failed to save.");
        }

        setIsSaving(false);
        setEditingUserId(null);
    };

    const handleToggleApproval = async (userId: string, currentStatus: boolean) => {
        // Optimistically update
        setLocalUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, approved_for_payment: !currentStatus } : u
        ));

        const res = await toggleUserApprovalAction(userId, !currentStatus);

        if (!res.success) {
            // Revert on failure
            setActionError(res.error || "Failed to update approval status.");
            setLocalUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, approved_for_payment: currentStatus } : u
            ));
        }
    };

    const toggleRefsExpand = (userId: string) => {
        if (expandedHistoryUserId === userId) setExpandedHistoryUserId(null); // Close history if open
        setExpandedRefsUserId(prev => prev === userId ? null : userId);
    };

    const toggleHistoryExpand = async (userId: string) => {
        if (expandedRefsUserId === userId) setExpandedRefsUserId(null); // Close refs if open

        if (expandedHistoryUserId === userId) {
            setExpandedHistoryUserId(null);
            setUserHistory([]);
            return;
        }

        setExpandedHistoryUserId(userId);
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

    const filteredUsers = localUsers.filter(user =>
        user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search contributors by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss bg-white transition-shadow"
                    />
                </div>
            </div>

            {actionError && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 m-4 flex justify-between items-center">
                    <span>{actionError}</span>
                    <button onClick={() => setActionError(null)} className="underline hover:no-underline">Dismiss</button>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 bg-gray-50/50 uppercase border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-medium">Contributor</th>
                            <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" />Lifetime Uploads</div></th>
                            <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Referrals</div></th>
                            <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1.5"><FilePlus className="w-3.5 h-3.5" />Batch Files</div></th>
                            <th className="px-6 py-4 font-medium text-center"><div className="flex justify-center" title="Approved for Payout"><ShieldCheck className="w-3.5 h-3.5" /></div></th>
                            <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1.5">Earnings</div></th>
                            <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5" />Withdrawable</div></th>
                            <th className="px-6 py-4 font-medium text-right"><div className="flex items-center justify-end gap-1.5"><DollarSign className="w-3.5 h-3.5" /> God Mode Override</div></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => {
                            const isEditing = editingUserId === user.id;
                            const hasOverride = user.admin_override_earnings !== null;

                            return (
                                <React.Fragment key={user.id}>
                                <tr className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-gray-900 border-l-4 border-transparent group-hover:border-moss transition-all">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-charcoal text-base">{user.display_name}</span>
                                                {user.account_type === 'ghost' && (
                                                    <span className="px-2 py-0.5 rounded-full bg-charcoal text-cream text-[10px] font-bold tracking-wider uppercase">
                                                        Ghost
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500 mt-0.5 font-mono">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 font-medium whitespace-nowrap">
                                                {user.files_count || 0} file{user.files_count === 1 ? '' : 's'}
                                            </span>
                                            <span className="text-xs text-gray-500 whitespace-nowrap mt-0.5" title="Lifetime GBs">
                                                {Number(user.total_gbs_uploaded).toFixed(2)} GB
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-900 font-medium whitespace-nowrap">
                                                    {user.referred_users_count || 0} user{user.referred_users_count === 1 ? '' : 's'}
                                                </span>
                                                {user.referred_users_count && user.referred_users_count > 0 ? (
                                                    <button 
                                                        onClick={() => toggleRefsExpand(user.id)}
                                                        className="text-[10px] font-bold uppercase tracking-wider text-moss bg-moss/10 hover:bg-moss/20 px-2 py-0.5 rounded transition-colors"
                                                    >
                                                        {expandedRefsUserId === user.id ? 'Hide' : 'View'}
                                                    </button>
                                                ) : null}
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap" title="Referral Earnings">
                                                ₹{(Number(user.referral_earnings || 0) / godModeConfig.displayDivisors.default).toFixed(2)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="inline-flex items-center justify-center min-w-[32px] h-8 px-3 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">
                                                {user.batch_files_count || 0}
                                            </div>
                                            <span className="text-xs text-gray-500 mt-1">
                                                {user.batch_gbs || '0.00'} GB
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleToggleApproval(user.id, user.approved_for_payment)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${user.approved_for_payment
                                                ? 'bg-moss/10 text-moss hover:bg-moss/20'
                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                }`}
                                        >
                                            {user.approved_for_payment ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5" /> Approved</>
                                            ) : (
                                                <><XCircle className="w-3.5 h-3.5" /> Blocked</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${hasOverride ? "bg-gray-100 text-gray-400 line-through" : "bg-green-50 text-green-700"}`}>
                                            ₹{((Number(user.photo_earnings || 0) / godModeConfig.displayDivisors.image) + (Number(user.other_earnings || user.calculated_earnings || 0) / godModeConfig.displayDivisors.default)).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${Number(user.withdrawable_balance || 0) > 0 ? "bg-green-50 text-green-700" : "text-gray-300"}`}>
                                                ₹{Number(user.withdrawable_balance || 0).toFixed(2)}
                                            </span>
                                            <button 
                                                onClick={() => toggleHistoryExpand(user.id)}
                                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-colors flex items-center gap-1 mt-1 ${
                                                    expandedHistoryUserId === user.id 
                                                        ? 'bg-charcoal text-white' 
                                                        : 'text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-700'
                                                }`}
                                            >
                                                <History className="w-3 h-3" />
                                                {expandedHistoryUserId === user.id ? 'Close' : 'Ledger'}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right min-w-[200px]">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2 items-center">
                                                <div className="flex items-center gap-1 border border-charcoal/20 rounded px-2 bg-white w-28 shrink-0">
                                                    <span className="text-gray-400 text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        placeholder="Auto"
                                                        className="w-full py-1.5 text-right text-sm focus:outline-none bg-transparent min-w-0"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSave(user.id);
                                                            if (e.key === 'Escape') handleCancel();
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleSave(user.id)}
                                                    disabled={isSaving}
                                                    className="p-1.5 text-white bg-moss hover:bg-moss/90 rounded shrink-0 transition-colors disabled:opacity-50 shadow-sm"
                                                    title="Save Override"
                                                >
                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    disabled={isSaving}
                                                    className="p-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded shrink-0 transition-colors disabled:opacity-50 shadow-sm"
                                                    title="Cancel"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-3 flex-nowrap">
                                                <span className={`font-bold whitespace-nowrap ${hasOverride ? 'text-charcoal text-lg' : 'text-gray-300'}`}>
                                                    {hasOverride ? `₹${Number(user.admin_override_earnings).toFixed(2)}` : 'Automated'}
                                                </span>
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-2 text-gray-400 hover:text-charcoal hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Edit Override"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                {expandedRefsUserId === user.id && user.referred_users_details && user.referred_users_details.length > 0 && (
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        <td colSpan={8} className="px-6 py-4">
                                            <div className="pl-6 border-l-2 border-moss/30 overflow-hidden relative">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                                                    Users Referred by {user.display_name}
                                                    <span className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">
                                                        {user.referred_users_details.length}
                                                    </span>
                                                </h4>
                                                
                                                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                                            <tr>
                                                                <th className="px-4 py-2.5 font-medium">Referred User</th>
                                                                <th className="px-4 py-2.5 font-medium">Joined Date</th>
                                                                <th className="px-4 py-2.5 font-medium text-right">Data Contributed</th>
                                                                <th className="px-4 py-2.5 font-medium text-right">Bonus Generated</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {user.referred_users_details.map((refUser) => (
                                                                <tr key={refUser.id} className="hover:bg-gray-50/50">
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-semibold text-charcoal">{refUser.display_name}</span>
                                                                            <span className="text-xs text-gray-500 font-mono">{refUser.email}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                                                                        {new Date(refUser.created_at).toLocaleDateString(undefined, {
                                                                            year: 'numeric', month: 'short', day: 'numeric'
                                                                        })}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="text-sm font-medium text-charcoal">{refUser.total_gbs_uploaded} GB</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="text-sm font-medium text-moss bg-moss/5 px-2 py-1 rounded">
                                                                            {refUser.referral_earnings_generated === 'Evaluating...' 
                                                                                ? <span className="text-xs text-moss/70 font-normal">Pending</span> 
                                                                                : `₹${(Number(refUser.referral_earnings_generated) / godModeConfig.displayDivisors.default).toFixed(2)}`
                                                                            }
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {expandedHistoryUserId === user.id && (
                                    <tr className="bg-gray-50/80 border-b border-gray-100 shadow-inner">
                                        <td colSpan={8} className="px-6 py-5">
                                            <div className="pl-6 border-l-2 border-charcoal/20 mx-4 max-w-3xl">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal mb-4 flex items-center gap-2">
                                                    <History className="w-4 h-4" />
                                                    Payout Ledger: {user.display_name}
                                                </h4>
                                                
                                                {loadingHistory ? (
                                                    <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading history...
                                                    </div>
                                                ) : userHistory.length === 0 ? (
                                                    <div className="text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-200 text-center">
                                                        This contributor has no withdrawal history yet.
                                                    </div>
                                                ) : (
                                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                                                <tr>
                                                                    <th className="px-4 py-3 font-medium">Status / Amount</th>
                                                                    <th className="px-4 py-3 font-medium">UPI ID</th>
                                                                    <th className="px-4 py-3 font-medium text-right">Date Details</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {userHistory.map((h) => (
                                                                    <tr key={h.id} className="hover:bg-gray-50/30">
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center gap-3">
                                                                                {getStatusBadge(h.status)}
                                                                                <span className="font-bold text-charcoal text-base">₹{Number(h.amount).toFixed(2)}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                                                            {h.upi_id}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <div className="flex flex-col items-end gap-1">
                                                                                <span className="text-xs text-gray-500">Requested: {formatDate(h.created_at)}</span>
                                                                                {h.paid_at && <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded">Paid: {formatDate(h.paid_at)}</span>}
                                                                                {h.admin_note && <span className="text-[10px] text-red-500 italic max-w-[200px] truncate" title={h.admin_note}>&quot;{h.admin_note}&quot;</span>}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <p>
                        {searchQuery ? `No contributors found matching "${searchQuery}"` : "No users to display yet."}
                    </p>
                </div>
            )}
        </div>
    );
}
