import { AuthForm } from "@/components/auth/AuthForm";
import { Suspense } from "react";

export default function SignupPage() {
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

            <div className="w-full relative z-10">
                <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading...</div>}>
                    <AuthForm mode="signup" />
                </Suspense>
            </div>

            <div className="mt-16 text-xs text-charcoal/40 text-center max-w-sm relative z-10">
                By signing up, you agree that your uploaded data will be sold to verified research partners and AI companies.
            </div>
        </div>
    );
}
