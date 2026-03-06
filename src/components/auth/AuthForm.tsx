"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight, User, Ghost } from "lucide-react";
import { loginAction, signupAction, oAuthSignInAction } from "@/app/actions/auth";
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

                <div className="flex p-1 rounded-xl mb-6 border relative z-10 w-full max-w-[280px] min-w-0 mx-auto" style={{ backgroundColor: '#f0f0f0', borderColor: '#ddd' }}>
                    <button
                        type="button"
                        onClick={() => setAccountType("standard")}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300"
                        style={accountType === "standard" ? { backgroundColor: '#fff', color: '#1C1C1A', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#999' }}
                    >
                        Standard
                    </button>
                    <button
                        type="button"
                        onClick={() => setAccountType("ghost")}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                        style={accountType === "ghost" ? { backgroundColor: '#1C1C1A', color: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } : { color: '#999' }}
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
                        <div className="space-y-4">
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => {
                                    setIsLoading(true);
                                    oAuthSignInAction("google");
                                }}
                                className="w-full font-medium py-3 rounded-xl border border-charcoal/10 hover:bg-black/5 active:bg-black/10 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none text-charcoal bg-white"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google
                            </button>

                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => {
                                    setIsLoading(true);
                                    oAuthSignInAction("twitter");
                                }}
                                className="w-full font-medium py-3 rounded-xl border border-charcoal/10 hover:bg-black/5 active:bg-black/10 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none text-charcoal bg-white"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                Continue with X
                            </button>
                            
                            <div className="text-center pt-2 text-xs text-charcoal/50">
                                <p>
                                    By continuing, you agree to our Terms and Privacy Policy
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                                    className="w-full font-semibold py-3.5 rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                                    style={{ backgroundColor: '#2E4036', color: '#ffffff', boxShadow: '0 8px 16px rgba(46,64,54,0.2)' }}
                                >
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
                        </div>
                    )}
                </form>
            </motion.div>
        </div>
    );
}
