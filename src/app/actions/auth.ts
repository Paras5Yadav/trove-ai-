"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Provider } from "@supabase/supabase-js";
import { ActionResponse, actionError, actionSuccess } from "@/types/actions";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isBackendEnabled = process.env.ENABLE_BACKEND === 'true';
const hasUpstashConfig = process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes("dummy");

// Rate limiters — only active when backend is enabled (Upstash available)
const loginLimiter = (isBackendEnabled && hasUpstashConfig) ? new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "ratelimit:login",
}) : null;

const signupLimiter = (isBackendEnabled && hasUpstashConfig) ? new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "ratelimit:signup",
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
        email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@trove-ghost.com`;
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
    redirect("/dashboard");
}

export async function signupAction(formData: FormData): Promise<ActionResponse | void> {
    const accountType = formData.get("accountType") as string || "standard";
    const password = formData.get("password") as string;
    const referralCode = formData.get("referralCode") as string;

    // Rate limit check
    if (signupLimiter) {
        const rateLimitKey = (formData.get("email") as string) ?? (formData.get("username") as string) ?? 'anonymous';
        const { success } = await signupLimiter.limit(rateLimitKey);
        if (!success) return actionError("Too many signup attempts. Please wait 1 minute.");
    }

    if (!password || password.length < 8) {
        return actionError("Password must be at least 8 characters");
    }

    let email = "";
    let displayName = "";

    if (accountType === "ghost") {
        const username = formData.get("username") as string;
        if (!username) return actionError("Username is required");
        
        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanUsername.length < 3) return actionError("Username must be at least 3 alphanumeric characters");
        
        email = `${cleanUsername}@trove-ghost.com`;
        displayName = username;
    } else {
        email = formData.get("email") as string;
        displayName = formData.get("displayName") as string;
        if (!email || !displayName) return actionError("Email and Display Name are required");
    }

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
            ...(accountType === "standard" && {
                emailRedirectTo: `${siteUrl}/api/auth/callback`,
            }),
        },
    });

    if (error) {
        if (error.message.includes("User already registered") && accountType === "ghost") {
            return actionError("This Ghost username is already taken. Please choose another one.");
        }
        return actionError(error.message);
    }

    // Process Referral Code
    let referredByUserId = null;
    if (referralCode) {
        // Find the user with this referral code
        const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', referralCode)
            .single();
            
        if (referrer) {
            referredByUserId = referrer.id;
        }
    }

    // Create the user profile
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: data.user.id,
                email: data.user.email,
                display_name: displayName,
                account_type: accountType,
                total_gbs_uploaded: 0,
                calculated_earnings: 0,
                referred_by_user_id: referredByUserId,
            }, { onConflict: 'id' });

        if (profileError) {
            console.error("Failed to create profile row:", profileError.message);
        }
    }

    // If Ghost account, redirect immediately since there's no email to confirm
    if (accountType === "ghost") {
        revalidatePath("/", "layout");
        redirect("/dashboard");
    }

    // For standard accounts, return success so the form can show the "check your email" message
    return actionSuccess({ emailConfirmation: true } as never);
}

export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
}

export async function oAuthSignInAction(provider: Provider, referralCode?: string): Promise<ActionResponse | void> {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL must be configured");

    let redirectUrl = `${siteUrl}/api/auth/callback`;
    if (referralCode) {
        redirectUrl += `?ref=${encodeURIComponent(referralCode)}`;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectUrl,
        },
    });

    if (error) {
        return actionError(error.message);
    }

    if (data.url) {
        redirect(data.url);
    }
}
