"use client";

import { useState } from "react";
import { Loader2, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { updatePasswordAction } from "@/app/actions/auth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        const result = await updatePasswordAction(password);

        if (!result.success) {
            setError(result.error);
        } else {
            setSuccess(true);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-sand flex flex-col items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-moss/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#85A693]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="mb-10 text-center relative z-10 flex flex-col items-center">
                <h1 className="text-4xl font-extrabold text-charcoal tracking-tighter">
                    Trove<span className="text-moss"> AI</span>
                </h1>
            </div>

            <div className="w-full max-w-md min-w-0 mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-5 sm:p-8"
                >
                    <div className="mb-6 sm:mb-8 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold font-jakarta text-charcoal tracking-tight">
                            Set New Password
                        </h2>
                        <p className="text-charcoal/60 mt-2">
                            Choose a strong password for your account.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50 text-red-600 rounded-xl p-4 flex items-start gap-3 text-sm font-medium overflow-hidden mb-6"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-emerald-50 text-emerald-700 rounded-xl p-5 flex flex-col items-center gap-3 text-sm font-medium overflow-hidden mb-6 text-center"
                            >
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                                </div>
                                <p className="font-semibold text-base">Password updated!</p>
                                <p className="text-emerald-600/70 text-xs">Your password has been changed successfully.</p>
                                <Link
                                    href="/login"
                                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold py-2.5 px-6 rounded-xl transition-all hover:-translate-y-0.5"
                                    style={{ backgroundColor: '#2E4036', color: '#ffffff', boxShadow: '0 8px 16px rgba(46,64,54,0.2)' }}
                                >
                                    Sign In Now
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!success && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/40 group-focus-within:text-moss transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-charcoal/5 border border-charcoal/10 rounded-xl focus:ring-2 focus:ring-moss focus:border-transparent outline-none transition-all placeholder:text-charcoal/30 font-medium text-charcoal"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">Confirm New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/40 group-focus-within:text-moss transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-charcoal/5 border border-charcoal/10 rounded-xl focus:ring-2 focus:ring-moss focus:border-transparent outline-none transition-all placeholder:text-charcoal/30 font-medium text-charcoal"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full font-semibold py-3.5 rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                                    style={{ backgroundColor: '#2E4036', color: '#ffffff', boxShadow: '0 8px 16px rgba(46,64,54,0.2)' }}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        "Update Password"
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>

            <div className="mt-16 text-xs text-charcoal/40 text-center max-w-sm relative z-10">
                Trove AI uses end-to-end encryption to securely authenticate your session.
            </div>
        </div>
    );
}
