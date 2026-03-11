"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight, User, Ghost, CheckCircle, ShieldAlert } from "lucide-react";
import { loginAction, signupAction, oAuthSignInAction } from "@/app/actions/auth";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

type AuthMode = "login" | "signup";

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        <path d="M1 1h22v22H1z" fill="none" />
    </svg>
);

export function AuthForm({ mode }: { mode: AuthMode }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accountType, setAccountType] = useState<"standard" | "ghost">("standard");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [consentChecked, setConsentChecked] = useState(false);

    const searchParams = useSearchParams();
    const referralCode = searchParams.get("ref") || "";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        // Client-side validation
        if (mode === "signup") {
            const pwd = formData.get("password") as string;
            const confirmPwd = formData.get("confirmPassword") as string;
            if (pwd !== confirmPwd) {
                setError(t("auth.passwordMismatch"));
                setIsLoading(false);
                return;
            }
        }
        
        // Consent validation applies to both login and signup (for standard accounts)
        if (accountType === "standard" && !consentChecked) {
            setError(t("auth.consentRequired"));
            setIsLoading(false);
            return;
        }
        const action = mode === "login" ? loginAction : signupAction;
        const result = await action(formData);

        if (result && !result.success) {
            setError(result.error);
            setIsLoading(false);
        } else if (result && result.success) {
            const resData = (result as { data?: { emailConfirmation?: boolean } }).data;
            if (resData?.emailConfirmation) {
                setSuccessMessage(t("auth.emailConfirmation"));
            }
            setIsLoading(false);
        }
    };

    const actionLabel = t("auth.continue");

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
                        {t("auth.welcome")}
                    </h2>
                    <p className="text-charcoal/60 mt-2">
                        {t("auth.welcomeSubtitle")}
                    </p>
                </div>

                <div className="flex p-1 rounded-xl mb-6 border relative z-10 w-full max-w-[280px] min-w-0 mx-auto" style={{ backgroundColor: '#f0f0f0', borderColor: '#ddd' }}>
                    <button
                        type="button"
                        onClick={() => setAccountType("standard")}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300"
                        style={accountType === "standard" ? { backgroundColor: '#fff', color: '#1C1C1A', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#999' }}
                    >
                        {t("auth.standard")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setAccountType("ghost")}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                        style={accountType === "ghost" ? { backgroundColor: '#1C1C1A', color: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' } : { color: '#999' }}
                    >
                        {t("auth.ghost")}
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

                <AnimatePresence mode="wait">
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-emerald-50 text-emerald-700 rounded-xl p-5 flex flex-col items-center gap-3 text-sm font-medium overflow-hidden mb-6 text-center"
                        >
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <p className="font-semibold text-base">{successMessage}</p>
                            <p className="text-emerald-600/70 text-xs">{t("auth.emailConfirmationSub")}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4 relative" style={successMessage ? { display: 'none' } : undefined}>
                    <input type="hidden" name="accountType" value={accountType} />
                    <input type="hidden" name="referralCode" value={referralCode} />

                    {accountType === "standard" ? (
                        <>
                            {/* Google Auth Button */}
                            <div className="mb-6 mt-2">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (accountType === "standard" && !consentChecked) {
                                            setError(t("auth.consentRequired"));
                                            return;
                                        }
                                        setIsGoogleLoading(true);
                                        await oAuthSignInAction("google", referralCode);
                                    }}
                                    disabled={isLoading || isGoogleLoading}
                                    className="w-full font-semibold py-3.5 rounded-xl border-2 border-charcoal/10 hover:border-charcoal/30 bg-white hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {isGoogleLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-charcoal/50" />
                                    ) : (
                                        <>
                                            <GoogleIcon />
                                            <span className="text-charcoal/80">{t("auth.continueWithGoogle")}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="pt-2 pb-2">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={consentChecked}
                                        onChange={(e) => setConsentChecked(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-charcoal/30 text-moss focus:ring-moss cursor-pointer"
                                    />
                                    <span className="text-xs text-charcoal/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: t("auth.consentText") }} />
                                </label>
                            </div>

                            <div className="pt-4 space-y-3">
                                <p className="text-[10px] text-center text-charcoal/50 leading-relaxed max-w-sm mx-auto">
                                    {t("auth.policyNote", { action: actionLabel })}{" "}
                                    <a href="/policies" target="_blank" rel="noopener noreferrer" className="underline hover:text-moss transition-colors">{t("auth.dataPolicies")}</a>.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">{t("auth.ghostUsername")}</label>
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
                                <div className="flex items-start gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                        {t("auth.anonWarning")}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1 mt-4">
                                <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">{t("auth.password")}</label>
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
                                <div className="space-y-1 mt-4">
                                    <label className="text-xs font-semibold text-charcoal/80 uppercase tracking-widest pl-1">{t("auth.confirmPassword")}</label>
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

                            <div className="pt-6 space-y-3">
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
                                            {actionLabel}
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* The encryption note that was here was a duplicate of the one in auth/page.tsx, so it was removed. */}
                </form>
            </motion.div>
        </div>
    );
}
