"use client";

import { useState } from "react";
import { X, Loader2, Banknote, AlertCircle } from "lucide-react";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    maxAmount: number;
    savedUpiId?: string;
}

export function WithdrawModal({ isOpen, onClose, maxAmount, savedUpiId }: WithdrawModalProps) {
    const [upiId, setUpiId] = useState(savedUpiId || "");
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const numAmount = parseFloat(amount);
        if (!upiId.trim()) {
            setError("Please enter your UPI ID");
            return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid amount");
            return;
        }
        if (numAmount > maxAmount) {
            setError(`Maximum available: $${maxAmount.toFixed(2)}`);
            return;
        }

        setIsSubmitting(true);

        try {
            const { submitWithdrawalAction } = await import("@/app/actions/vault");
            const result = await submitWithdrawalAction(upiId.trim(), numAmount);

            if (!result.success) {
                setError(result.error || "Failed to submit withdrawal request");
            } else {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setUpiId("");
                    setAmount("");
                    // Reload to refresh balances
                    window.location.reload();
                }, 2000);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Banknote className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Withdrawal Requested!</h3>
                        <p className="text-gray-500 text-sm">We'll process your payment shortly.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <Banknote className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Withdraw via UPI</h3>
                                <p className="text-sm text-gray-500">Available: ${maxAmount.toFixed(2)}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 rounded-xl p-3 flex items-center gap-2 text-sm mb-4">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
                                    UPI ID
                                </label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="name@ybl, name@paytm, 9876543210@upi"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 font-medium text-gray-900"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">
                                    Amount (USD)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0.01"
                                        max={maxAmount}
                                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 font-medium text-gray-900"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAmount(maxAmount.toFixed(2))}
                                    className="text-xs text-green-600 font-semibold hover:underline pl-1"
                                >
                                    Withdraw All
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Submit Withdrawal Request"
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
