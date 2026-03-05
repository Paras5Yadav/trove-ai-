"use server";

import { createClient } from "@/utils/supabase/server";
import { ActionResponse, actionError, actionSuccess } from "@/types/actions";
import { revalidatePath } from "next/cache";

// Type definitions for the admin panel
export interface AdminUserStats {
    id: string;
    email: string;
    display_name: string;
    account_type: "standard" | "ghost";
    total_gbs_uploaded: string;
    calculated_earnings: string;
    admin_override_earnings: string | null;
    approved_for_payment: boolean;
    created_at: string;
}

export interface AdminBatchStats {
    id: string;
    user_id: string;
    name: string;
    status: string;
    file_count: number;
    uploaded_bytes: number;
    batch_earnings: string;
    created_at: string;
}

/**
 * Validates if the current user is allowed to access admin features.
 * Add your email to ADMIN_EMAILS to get instant access.
 */
const ADMIN_EMAILS: string[] = [
    // Add your email here to get admin access, e.g:
    "parasyadav3031@gmail.com",
];

export async function checkAdminAccess() {
    // Always allow admin access in local development
    if (process.env.NODE_ENV === 'development') {
        console.log("✅ Admin access granted (development mode)");
        return true;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log("🔒 Admin check: No user logged in");
        return false;
    }

    console.log("🔍 Admin check — Logged in as:", user.email);
    console.log("🔍 Admin emails list:", ADMIN_EMAILS);

    // Check 1: Email-based admin list (easiest setup)
    if (user.email && ADMIN_EMAILS.includes(user.email)) {
        console.log("✅ Admin access granted via email match");
        return true;
    }

    // Check 2: Role-based from Supabase profiles table
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile?.role === 'admin';
    } catch {
        // If profiles table doesn't exist yet, fall back to email check only
        return false;
    }
}

/**
 * Fetches all registered users and their exact data stats.
 * Simulates 30 users if Backend = false
 */
export async function getAllUsersAction(): Promise<ActionResponse<AdminUserStats[]>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return actionError("Unauthorized access");

        if (process.env.NEXT_PUBLIC_ENABLE_BACKEND !== 'true') {
            // Return simulated god-mode users (all 75)
            const allMockUsers = Array.from({ length: 75 }).map((_, i) => ({
                id: `mock-user-${i}`,
                email: i % 4 === 0 ? `ghost${i}@trove-ghost.com` : `contributor_${i + 1}@example.com`,
                display_name: i % 4 === 0 ? `GhostUser${i}` : `John Doe ${i + 1}`,
                account_type: i % 4 === 0 ? "ghost" : "standard",
                total_gbs_uploaded: (Math.random() * 50).toFixed(2),
                calculated_earnings: (Math.random() * 200).toFixed(2),
                admin_override_earnings: i === 0 ? "500.00" : null,
                approved_for_payment: i % 3 === 0,
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString()
            }));

            return { success: true, data: allMockUsers as AdminUserStats[] };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, display_name, account_type, total_gbs_uploaded, calculated_earnings, admin_override_earnings, approved_for_payment, created_at')
            .order('created_at', { ascending: false })
            .limit(10000); // Fetch all users up to 10k

        if (error) throw error;

        return { success: true, data };

    } catch (error: unknown) {
        console.error("Admin error fetching users:", error instanceof Error ? error.message : "Unknown");
        return { success: false, error: "Failed to fetch users." };
    }
}

/**
 * Updates a specific user's `admin_override_earnings`.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EARNINGS_OVERRIDE = 100_000; // $100,000 cap

export async function setAdminOverrideEarningsAction(userId: string, overrideValue: string | null): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        if (process.env.NEXT_PUBLIC_ENABLE_BACKEND !== 'true') {
            await new Promise((res) => setTimeout(res, 500));
            revalidatePath('/admin');
            return { success: true };
        }

        // Validate userId format (after god mode bypass to allow mock-user-0)
        if (!UUID_REGEX.test(userId)) {
            return { success: false, error: "Invalid user ID format" };
        }

        const supabase = await createClient();
        let valueToSave = null;
        if (overrideValue && overrideValue !== "") {
            const parsed = parseFloat(overrideValue);
            if (isNaN(parsed) || parsed < 0 || !isFinite(parsed)) {
                return { success: false, error: "Override must be a positive number" };
            }
            if (parsed > MAX_EARNINGS_OVERRIDE) {
                return { success: false, error: `Override cannot exceed $${MAX_EARNINGS_OVERRIDE.toLocaleString()}` };
            }
            valueToSave = parsed;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ admin_override_earnings: valueToSave })
            .eq('id', userId);

        if (error) throw error;

        revalidatePath('/admin'); // Re-run the table
        return { success: true };

    } catch (error: unknown) {
        console.error("Admin update error:", error instanceof Error ? error.message : "Unknown");
        return { success: false, error: "Failed to update override." };
    }
}

/**
 * Set the global multiplier that applies to the entire platform.
 */
export async function setGlobalMultiplierAction(multiplier: number): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        // Bounds check: multiplier must be between 0 and 10
        if (typeof multiplier !== 'number' || isNaN(multiplier) || multiplier < 0 || multiplier > 10) {
            return { success: false, error: "Multiplier must be a number between 0 and 10" };
        }

        if (process.env.NEXT_PUBLIC_ENABLE_BACKEND !== 'true') {
            await new Promise((res) => setTimeout(res, 300));
            revalidatePath('/admin');
            return { success: true };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('app_config')
            .update({ global_earnings_multiplier: multiplier })
            .eq('id', 1);

        if (error) throw error;

        revalidatePath('/admin');
        return { success: true };

    } catch (error: unknown) {
        console.error("Set multiplier error:", error instanceof Error ? error.message : "Unknown");
        return { success: false, error: "Failed to update global multiplier." };
    }
}

/**
 * Toggles whether a user is approved to actually receive their payouts.
 */
export async function toggleUserApprovalAction(userId: string, approved: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        if (process.env.NEXT_PUBLIC_ENABLE_BACKEND !== 'true') {
            await new Promise((res) => setTimeout(res, 300));
            revalidatePath('/admin');
            return { success: true };
        }

        // Validate userId format (after god mode bypass to allow mock-user-0)
        if (!UUID_REGEX.test(userId)) {
            return { success: false, error: "Invalid user ID format" };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('profiles')
            .update({ approved_for_payment: approved })
            .eq('id', userId);

        if (error) throw error;

        revalidatePath('/admin');
        return { success: true };

    } catch (error: unknown) {
        console.error("Toggle approval error:", error instanceof Error ? error.message : "Unknown");
        return { success: false, error: "Failed to update user approval status." };
    }
}
