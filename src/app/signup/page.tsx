import { AuthForm } from "@/components/auth/AuthForm";
import { VaultLogo } from "@/components/icons/VaultLogo";

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-sand flex flex-col items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-moss/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#85A693]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="mb-10 text-center relative z-10 flex flex-col items-center">
                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-white/20 shadow-sm mb-4 inline-flex">
                    <VaultLogo className="w-12 h-12 text-moss" />
                </div>
                <h1 className="text-4xl font-extrabold text-charcoal tracking-tighter">
                    Trove<span className="text-moss"> AI</span>
                </h1>
            </div>

            <div className="w-full relative z-10">
                <AuthForm mode="signup" />
            </div>

            <div className="mt-16 text-xs text-charcoal/40 text-center max-w-sm relative z-10">
                By signing up, you agree to securely contribute datasets for AI training purposes.
            </div>
        </div>
    );
}
