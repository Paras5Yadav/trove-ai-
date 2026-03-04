"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight, User, Ghost } from "lucide-react";
import { loginAction, signupAction } from "@/app/actions/auth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accountType, setAccountType] = useState<"standard" | "ghost">("standard");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        // Client-side validation for sign up
        if (mode === "signup") {
            const pwd = formData.get("password") as string;
            const confirmPwd = formData.get("confirmPassword") as string;
            if (pwd !== confirmPwd) {
                setError("Passwords do not match");
                setIsLoading(false);
                return;
            }
        }

        const action = mode === "login" ? loginAction : signupAction;
        const result = await action(formData);

        if (result && !result.success) {
            setError(result.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md min-w-0 mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-5 sm:p-8"
            >
                <div className="mb-6 sm:mb-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold font-jakarta text-charcoal tracking-tight">
                        {mode === "login" ? "Welcome Back" : "Create Account"}
                    </h2>
                    <p className="text-charcoal/60 mt-2">
                        {mode === "login"
                            ? "Enter your credentials to access the vault."
                            : "Join the network and start earning passive income."}
                    </p>
                </div>

                <div className="flex p-1 bg-charcoal/5 rounded-xl mb-6 border border-charcoal/10 relative z-10 w-full max-w-[280px] min-w-0 mx-auto">
                    <button
                        type="button"
                        onClick={() => setAccountType("standard")}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300",
                            accountType === "standard" ? "bg-white shadow-sm text-charcoal" : "text-charcoal/50 hover:text-charcoal/80"
                        )}
                    >
                        Standard
                    </button>
                    <button
                        type="button"
                        onClick={() => setAccountType("ghost")}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                            accountType === "ghost" ? "bg-charcoal text-white shadow-sm" : "text-charcoal/50 hover:text-charcoal/80"
                        )}
                    >
                        Ghost
                    </button>
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

                <form onSubmit={handleSubmit} className="space-y-4 relative">
                    <input type="hidden" name="accountType" value={accountType} />

                    {accountType === "standard" ? (
                        <>
                            {mode === "signup" && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">Display Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/40 group-focus-within:text-moss transition-colors">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <input
                                            name="displayName"
                                            type="text"
                                            required={accountType === "standard" && mode === "signup"}
                                            placeholder="John Doe"
                                            className="w-full pl-11 pr-4 py-3 bg-charcoal/5 border border-charcoal/10 rounded-xl focus:ring-2 focus:ring-moss focus:border-transparent outline-none transition-all placeholder:text-charcoal/30 font-medium text-charcoal"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/40 group-focus-within:text-moss transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <input
                                        name="email"
                                        type="email"
                                        required={accountType === "standard"}
                                        placeholder="name@example.com"
                                        className="w-full pl-11 pr-4 py-3 bg-charcoal/5 border border-charcoal/10 rounded-xl focus:ring-2 focus:ring-moss focus:border-transparent outline-none transition-all placeholder:text-charcoal/30 font-medium text-charcoal"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">Ghost Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/40 group-focus-within:text-moss transition-colors">
                                    <Ghost className="h-5 w-5" />
                                </div>
                                <input
                                    name="username"
                                    type="text"
                                    required={accountType === "ghost"}
                                    placeholder="CryptoKing99"
                                    className="w-full pl-11 pr-4 py-3 bg-charcoal/5 border border-charcoal/10 rounded-xl focus:ring-2 focus:ring-moss focus:border-transparent outline-none transition-all placeholder:text-charcoal/30 font-medium text-charcoal"
                                />
                            </div>
                            {mode === "signup" && <p className="text-xs text-charcoal/50 pl-1 mt-1">Anonymous mode. Withdrawals disabled.</p>}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/40 group-focus-within:text-moss transition-colors">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3 bg-charcoal/5 border border-charcoal/10 rounded-xl focus:ring-2 focus:ring-moss focus:border-transparent outline-none transition-all placeholder:text-charcoal/30 font-medium text-charcoal"
                            />
                        </div>
                    </div>

                    {mode === "signup" && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">Confirm Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/40 group-focus-within:text-moss transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-charcoal/5 border border-charcoal/10 rounded-xl focus:ring-2 focus:ring-moss focus:border-transparent outline-none transition-all placeholder:text-charcoal/30 font-medium text-charcoal"
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-moss text-white font-semibold py-3.5 rounded-xl shadow-[0_8px_16px_rgba(46,64,54,0.2)] hover:shadow-[0_8px_24px_rgba(46,64,54,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_10px_rgba(46,64,54,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 w-full h-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {mode === "login" ? "Sign In Securely" : "Initialize Account"}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="text-center pt-6 text-sm text-charcoal/60">
                        {mode === "login" ? (
                            <p>
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="text-moss font-semibold hover:underline">
                                    Sign up now
                                </Link>
                            </p>
                        ) : (
                            <p>
                                Already joined the network?{" "}
                                <Link href="/login" className="text-moss font-semibold hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
