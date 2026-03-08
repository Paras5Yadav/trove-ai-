"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction, deleteAccountAction } from "@/app/actions/auth";
import { LogOut, Trash2, AlertTriangle, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ClientNav({ isLoggedIn }: { isLoggedIn: boolean }) {
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isHome = pathname === "/";
    const isDashboard = pathname?.startsWith("/dashboard");

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        await deleteAccountAction();
        // redirect happens in the server action
    };

    return (
        <>
            <nav className="flex items-center gap-6 text-sm font-medium tracking-wide uppercase opacity-60 pointer-events-auto">
                {!isHome && (
                    <Link href="/" className="hover:opacity-100 transition-opacity">
                        Home
                    </Link>
                )}

                {!isDashboard && isLoggedIn && (
                    <Link href="/dashboard" className="hover:opacity-100 transition-opacity">
                        Dashboard
                    </Link>
                )}

                {isLoggedIn ? (
                    isDashboard && (
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 hover:opacity-100 transition-opacity bg-charcoal/5 px-4 py-2 rounded-full"
                            >
                                Account
                                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setIsDropdownOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-48 bg-white border border-charcoal/10 rounded-2xl shadow-xl overflow-hidden z-50 py-2"
                                        >
                                            <form action={signOutAction} className="w-full">
                                                <button
                                                    type="submit"
                                                    className="w-full text-left px-4 py-2.5 text-xs text-charcoal hover:bg-charcoal/5 flex items-center gap-2 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4 opacity-50" />
                                                    Sign Out
                                                </button>
                                            </form>
                                            
                                            <div className="h-px w-full bg-charcoal/5 my-1" />
                                            
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 opacity-50" />
                                                Delete Account
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                ) : (
                    <Link
                        href="/login"
                        className="hover:opacity-100 transition-opacity bg-gradz-charcoal text-gradz-cream px-4 py-2 rounded-full text-xs"
                    >
                        Sign In
                    </Link>
                )}
            </nav>

            {/* Delete Account Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
                            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl border border-charcoal/10"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-6">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            
                            <h3 className="text-2xl font-bold text-charcoal mb-2 tracking-tight">
                                Delete Account?
                            </h3>
                            
                            <p className="text-charcoal/60 text-sm leading-relaxed mb-8">
                                This action is permanent and cannot be undone. All your pending earnings will be forfeited. Any data already sold to partners cannot be retracted.
                            </p>
                            
                            <div className="flex flex-col-reverse sm:flex-row gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className="px-6 py-3 rounded-xl font-semibold text-charcoal bg-charcoal/5 hover:bg-charcoal/10 transition-colors disabled:opacity-50 flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 flex-1 shadow-lg shadow-red-600/20"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete Permanently"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
