"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function Footer() {
    const { t } = useTranslation();
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-charcoal/5 bg-gradz-cream/50 py-6 px-6 sm:px-12 md:px-24">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs text-charcoal/40">
                    <span>{t("footer.copyright", { year })}</span>
                    <Link href="/policies" className="hover:text-charcoal transition-colors">
                        {t("footer.policies")}
                    </Link>
                </div>
                <LanguageSwitcher variant="dropdown" />
            </div>
        </footer>
    );
}
