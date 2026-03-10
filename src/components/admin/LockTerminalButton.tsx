"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { lockAdminTerminalAction } from "@/app/actions/admin-auth";
import { useRouter } from "next/navigation";

export function LockTerminalButton() {
    const [isLocking, setIsLocking] = useState(false);
    const router = useRouter();

    const handleLock = async () => {
        setIsLocking(true);
        try {
            await lockAdminTerminalAction();
            router.refresh(); // Force page refresh to trigger the gate
        } catch (error) {
            console.error(error);
            setIsLocking(false);
        }
    };

    return (
        <button 
            onClick={handleLock}
            disabled={isLocking}
            className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
        >
            <Lock className="w-4 h-4" />
            {isLocking ? "Locking..." : "Lock Terminal"}
        </button>
    );
}
