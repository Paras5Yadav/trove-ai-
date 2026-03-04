"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Provider } from "@supabase/supabase-js";
import { ActionResponse, actionError, actionSuccess } from "@/types/actions";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isBackendEnabled = process.env.NEXT_PUBLIC_ENABLE_BACKEND === 'true';

// Rate limiters — only active when backend is enabled (Upstash available)
const loginLimiter = isBackendEnabled ? new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "rl:login",
}) : null;

const signupLimiter = isBackendEnabled ? new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    prefix: "rl:signup",
}) : null;

export async function loginAction(formData: FormData): Promise<ActionResponse | void> {
    const accountType = formData.get("accountType") as string || "standard";
    let email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Rate limit check
    if (loginLimiter) {
        const { success } = await loginLimiter.limit(email ?? 'anonymous');
        if (!success) return actionError("Too many login attempts. Please wait 1 minute.");
    }

    if (accountType === "ghost") {
        const username = formData.get("username") as string;
        if (!username || !password) return actionError("Username and password are required");
        email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@datavault-ghost.local`;
    } else {
        if (!email || !password) return actionError("Email and password are required");
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        if (error.message.includes("Invalid login credentials") && accountType === "ghost") {
            return actionError("Invalid Ghost Username or Password");
        }
        return actionError(error.message);
    }

    revalidatePath("/", "layout");
    redirect("/vault");
}

export async function signupAction(formData: FormData): Promise<ActionResponse | void> {
    const accountType = formData.get("accountType") as string || "standard";
    const password = formData.get("password") as string;

    // Rate limit check (use email or username as identifier)
    if (signupLimiter) {
        const rateLimitKey = (formData.get("email") as string) ?? (formData.get("username") as string) ?? 'anonymous';
        const { success } = await signupLimiter.limit(rateLimitKey);
        if (!success) return actionError("Too many signup attempts. Please wait 1 minute.");
    }

    const confirmPassword = formData.get("confirmPassword") as string;

    let email = "";
    let displayName = "";

    if (accountType === "ghost") {
        const username = formData.get("username") as string;
        if (!username || !password) return actionError("Username and password are required");
        // Enforce basic alphanumeric username to avoid weird emails
        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanUsername.length < 3) return actionError("Username must be at least 3 alphanumeric characters");
        email = `${cleanUsername}@datavault-ghost.local`;
        displayName = username; // Keep original casing for display
    } else {
        email = formData.get("email") as string;
        displayName = formData.get("displayName") as string;
        if (!email || !displayName || !password) return actionError("Email, Display Name, and password are required");
    }

    if (password.length < 8) return actionError("Password must be at least 8 characters");

    if (password !== confirmPassword) {
        return actionError("Passwords do not match");
    }

    const supabase = await createClient();

    const { error, data } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        // If the email is taken, it means the username is taken
        if (error.message.includes("User already registered") && accountType === "ghost") {
            return actionError("This Ghost username is already taken. Please choose another one.");
        }
        return actionError(error.message);
    }

    // Explicitly create the user profile if signUp succeeds
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: data.user.id,
                email: data.user.email,
                display_name: displayName,
                account_type: accountType,
                total_gbs_uploaded: 0,
                calculated_earnings: 0
            }, { onConflict: 'id' });

        if (profileError) {
            console.error("Failed to create profile row:", profileError.message);
        }
    }

    revalidatePath("/", "layout");
    redirect("/vault");
}

export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
}

export async function oAuthSignInAction(provider: Provider): Promise<ActionResponse | void> {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL must be configured");

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${siteUrl}/api/auth/callback`,
        },
    });

    if (error) {
        return actionError(error.message);
    }

    if (data.url) {
        redirect(data.url);
    }
}
