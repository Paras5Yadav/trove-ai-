"use client";

import { useEffect, useState } from "react";

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        import("@/i18n/config").then(() => setIsReady(true));
    }, []);

    if (!isReady) return null;

    return <>{children}</>;
}
