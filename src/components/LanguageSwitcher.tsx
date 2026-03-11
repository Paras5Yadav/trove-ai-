"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "raj", label: "राजस्थानी" },
];

interface LanguageSwitcherProps {
    variant?: "dropdown" | "inline";
}

export function LanguageSwitcher({ variant = "dropdown" }: LanguageSwitcherProps) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    // Inline variant — render as a flat list (for Account dropdown)
    if (variant === "inline") {
        return (
            <div className="px-2 py-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-charcoal/40 px-2 mb-1">
                    Language
                </div>
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                            i18n.language === lang.code
                                ? "bg-moss/10 text-moss font-semibold"
                                : "text-charcoal/70 hover:bg-charcoal/5"
                        }`}
                    >
                        <span>{lang.label}</span>
                        {i18n.language === lang.code && <Check className="w-3.5 h-3.5" />}
                    </button>
                ))}
            </div>
        );
    }

    // Dropdown variant — globe icon with popup (for Footer)
    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-charcoal/50 hover:text-charcoal transition-colors text-xs font-medium"
                aria-label="Switch language"
            >
                <Globe className="w-4 h-4" />
                <span>{LANGUAGES.find((l) => l.code === i18n.language)?.label || "English"}</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 left-0 bg-white border border-charcoal/10 rounded-xl shadow-lg overflow-hidden py-1 min-w-[140px] z-50">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors ${
                                i18n.language === lang.code
                                    ? "bg-moss/10 text-moss font-semibold"
                                    : "text-charcoal/70 hover:bg-charcoal/5"
                            }`}
                        >
                            <span>{lang.label}</span>
                            {i18n.language === lang.code && <Check className="w-3.5 h-3.5" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
