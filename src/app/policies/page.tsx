import Link from "next/link";
import { ArrowLeft, ShieldAlert, FileText, Lock, AlertCircle } from "lucide-react";

export default function PoliciesPage() {
    return (
        <div className="min-h-screen bg-sand flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-moss/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#85A693]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10 mb-8">
                <Link href="/" className="inline-flex items-center gap-2 text-charcoal/60 hover:text-charcoal transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </div>

            <div className="w-full max-w-2xl relative z-10">
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-6 sm:p-10 mb-8">
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-moss/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="w-8 h-8 text-moss" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight mb-3">
                            Data Contributor Policies
                        </h1>
                        <p className="text-charcoal/60">
                            Clear, transparent rules on how your data is used, sold, and protected on Trove AI.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Section 1 */}
                        <section className="bg-charcoal/5 rounded-2xl p-6 border border-charcoal/5">
                            <h2 className="flex items-center gap-3 text-lg font-bold text-charcoal mb-4">
                                <FileText className="w-5 h-5 text-moss" />
                                1. Data Sale & Usage Rights
                            </h2>
                            <p className="text-sm text-charcoal/70 leading-relaxed space-y-3">
                                <span className="block mb-2">By uploading files to Trove AI, you grant us an irrevocable, worldwide right to license, sell, and distribute your data to third-party entities.</span>
                                
                                <span className="block mb-2"><strong className="text-charcoal block mb-1">Who buys this data?</strong> Our primary buyers are verified research laboratories, academic institutions, and artificial intelligence companies seeking authentic human-generated content to train machine learning models.</span>
                                
                                <span className="block mb-2"><strong className="text-charcoal block mb-1">Your Earnings:</strong> In exchange for these rights, you are compensated for every file that passes validation and is added to a marketable batch.</span>
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/50">
                            <h2 className="flex items-center gap-3 text-lg font-bold text-amber-900 mb-4">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                2. Irrevocability & Retraction
                            </h2>
                            <p className="text-sm text-amber-800/80 leading-relaxed font-medium">
                                Once data has been validated and sold to a third-party partner, it cannot be retracted. While you retain the right to delete your Trove AI account at any time, doing so will not remove previously sold datasets from our partners&apos; servers or AI training pipelines. Upload carefully.
                            </p>
                        </section>

                        {/* Section 3 */}
                        <section className="bg-charcoal/5 rounded-2xl p-6 border border-charcoal/5">
                            <h2 className="flex items-center gap-3 text-lg font-bold text-charcoal mb-4">
                                <Lock className="w-5 h-5 text-moss" />
                                3. Content Review & Privacy
                            </h2>
                            <p className="text-sm text-charcoal/70 leading-relaxed">
                                We take data integrity and privacy seriously. All uploaded datasets are subject to our proprietary quality assurance and verification processes before entering the marketplace. By uploading, you acknowledge it is your sole responsibility to ensure you have the necessary rights to the content, and that you are fully comfortable sharing the visual, audio, and contextual details of your uploads with our verified research partners and buyers.
                            </p>
                        </section>
                    </div>

                    <div className="mt-10 pt-8 border-t border-charcoal/10 text-center space-y-4">
                        <Link href="/auth" className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-charcoal text-white rounded-xl font-semibold hover:bg-black hover:-translate-y-0.5 transition-all shadow-lg shadow-charcoal/20">
                            I Understand, Continue
                        </Link>
                        <p className="text-[10px] text-center text-charcoal/50 leading-relaxed max-w-sm mx-auto">
                            By clicking Continue, you confirm that you have read and agreed to the Data Contributor Policies.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
