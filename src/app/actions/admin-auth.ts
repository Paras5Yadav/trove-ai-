"use server";

import { cookies } from "next/headers";
import { ActionResponse, actionError, actionSuccess } from "@/types/actions";

export async function verifyAdminPasswordAction(password: string): Promise<ActionResponse<{ message: string }>> {
    try {
        const correctPassword = process.env.ADMIN_PASSWORD;

        if (!correctPassword) {
            console.error("ADMIN_PASSWORD environment variable is not set!");
            return actionError("Admin authentication is currently misconfigured on the server.");
        }

        if (password === correctPassword) {
            const cookieStore = await cookies();
            cookieStore.set('admin_unlocked', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                // No maxAge: This creates a "session cookie" that expires as soon as the browser tab/window is closed.
            });
            return actionSuccess({ message: "Access Granted" });
        }

        return actionError("Incorrect password");
    } catch (error) {
        console.error("Password verification error:", error);
        return actionError("An unexpected error occurred.");
    }
}

export async function lockAdminTerminalAction(): Promise<ActionResponse<{ message: string }>> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('admin_unlocked');
        return actionSuccess({ message: "Terminal Locked" });
    } catch (error) {
        console.error("Lock terminal error:", error);
        return actionError("Failed to lock terminal.");
    }
}
