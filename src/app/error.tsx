"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service in production
        console.error("Global app error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-sand flex items-center justify-center p-6 text-charcoal font-mono">
            <div className="max-w-md w-full bg-cream rounded-3xl p-8 text-center shadow-lg border border-moss/10">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                
                <h1 className="text-2xl font-bold font-jakarta mb-3">
                    Something went wrong
                </h1>
                
                <p className="text-charcoal/60 mb-8 font-medium">
                    We&apos;re sorry, but an unexpected error occurred while loading this page. 
                    Our team has been notified.
                </p>
                
                <div className="flex flex-col gap-3">
                    <button
                        onClick={reset}
                        className="w-full bg-moss text-cream px-6 py-3 rounded-xl font-bold hover:bg-moss/90 transition-colors"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="w-full bg-charcoal/5 text-charcoal px-6 py-3 rounded-xl font-bold hover:bg-charcoal/10 transition-colors"
                    >
                        Return to Home
                    </Link>
                </div>
                
                {process.env.NODE_ENV === "development" && (
                    <div className="mt-8 p-4 bg-red-50 text-red-800 text-xs rounded-xl overflow-auto text-left break-all">
                        <p className="font-bold mb-1">Dev Error:</p>
                        {error.message}
                    </div>
                )}
            </div>
        </div>
    );
}
