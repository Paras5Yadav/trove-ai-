import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import raj from "./locales/raj.json";

const savedLanguage = typeof window !== "undefined" ? localStorage.getItem("trove-lang") || "en" : "en";

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        hi: { translation: hi },
        raj: { translation: raj },
    },
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
        escapeValue: false, // React already escapes
    },
});

// Persist language preference whenever it changes
i18n.on("languageChanged", (lng: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("trove-lang", lng);
    }
});

export default i18n;
