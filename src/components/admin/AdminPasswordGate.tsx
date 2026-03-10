"use client";

import { useState } from "react";
import { ShieldAlert, ArrowRight, Lock } from "lucide-react";
import { verifyAdminPasswordAction } from "@/app/actions/admin-auth";
import { useRouter } from "next/navigation";

export function AdminPasswordGate() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await verifyAdminPasswordAction(password);
            if (res.success) {
                // Force a full refresh to re-run the Server Components
                router.refresh(); 
            } else {
                setError(res.error || "Authentication failed");
                setPassword("");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-200">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-blue-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 font-jakarta">Security Gateway</h1>
                <p className="text-gray-500 mb-8 font-medium">
                    Please provide the master password to unlock the God Mode Terminal in this environment.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Override Password"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium bg-gray-50"
                            autoFocus
                        />
                    </div>
                    
                    {error && (
                        <div className="text-red-500 text-sm font-medium bg-red-50 py-2 px-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading || !password}
                        className="w-full bg-charcoal text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Unlock Terminal
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
