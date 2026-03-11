"use server";

import { createClient, createServiceClient } from "@/utils/supabase/server";
import { ActionResponse, actionError, actionSuccess } from "@/types/actions";
import { revalidatePath } from "next/cache";
import { godModeConfig } from "@/config/god-mode";

// Type definitions for the admin panel
export interface AdminUserStats {
    id: string;
    email: string;
    display_name: string;
    account_type: "standard" | "ghost";
    total_gbs_uploaded?: string;
    calculated_earnings?: string;
    admin_override_earnings?: string | null;
    withdrawable_balance?: string | null;
    approved_for_payment: boolean;
    files_count?: number;
    pending_files_count?: number;
    batch_files_count?: number;
    batch_gbs?: string;
    referred_users_count?: number;
    referral_earnings?: string;
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
const ADMIN_EMAILS: string[] = process.env.ADMIN_EMAILS 
    ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) 
    : ["parasyadav3031@gmail.com"];

export async function checkAdminAccess() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        if (process.env.NODE_ENV === 'development') console.log("🔒 Admin check: No user logged in");
        return false;
    }

    if (process.env.NODE_ENV === 'development') {
        console.log("🔍 Admin check — Logged in as:", user.email);
        console.log("🔍 Admin emails list:", ADMIN_EMAILS);
    }

    // Check 1: Email-based admin list (easiest setup)
    if (user.email && ADMIN_EMAILS.includes(user.email)) {
        if (process.env.NODE_ENV === 'development') console.log("✅ Admin access granted via email match");
        return true;
    }

    // Check 1.5: Development Mode Bypass (Restored)
    if (process.env.NODE_ENV === 'development') {
        console.log("🚧 Admin access granted via DEVELOPMENT BYPASS");
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

        if (process.env.ENABLE_BACKEND !== 'true') {
            // Return simulated god-mode users (all 75)
            const allMockUsers = Array.from({ length: 75 }).map((_, i) => ({
                id: `mock-user-${i}`,
                email: i % 4 === 0 ? `ghost${i}@trove-ghost.com` : `contributor_${i + 1}@example.com`,
                display_name: i % 4 === 0 ? `GhostUser${i}` : `John Doe ${i + 1}`,
                account_type: i % 4 === 0 ? "ghost" : "standard",
                total_gbs_uploaded: (Math.random() * 50).toFixed(2),
                calculated_earnings: (Math.random() * 200 * 92).toFixed(2),
                admin_override_earnings: i === 0 ? "46000.00" : null,
                withdrawable_balance: i === 0 ? "46000.00" : "0.00",
                approved_for_payment: i % 3 === 0,
                created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                files_count: Math.floor(Math.random() * 50),
                pending_files_count: Math.floor(Math.random() * 10),
                referred_users_count: Math.floor(Math.random() * 5),
                referral_earnings: (Math.random() * 500).toFixed(2),
            }));

            return { success: true, data: allMockUsers as AdminUserStats[] };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, display_name, account_type, total_gbs_uploaded, calculated_earnings, admin_override_earnings, withdrawable_balance, approved_for_payment, created_at, referral_earnings, files(count)')
            .order('created_at', { ascending: false })
            .limit(10000); // Fetch all users up to 10k

        if (error) throw error;

        // Fetch pending files count per user
        const { data: pendingFiles } = await supabase
            .from('files')
            .select('user_id')
            .eq('status', 'pending_review');
            
        const pendingCounts: Record<string, number> = {};
        pendingFiles?.forEach(f => {
            pendingCounts[f.user_id] = (pendingCounts[f.user_id] || 0) + 1;
        });

        // Fetch ALL batch files for the current batch
        const batchName = godModeConfig.currentBatch.id;
        const batchCounts: Record<string, number> = {};
        const batchGbs: Record<string, number> = {};
        const batchAssetValues: Record<string, number> = {};
        
        const { data: batchData } = await supabase
            .from('batches')
            .select('id')
            .eq('name', batchName)
            .single();
            
        if (batchData) {
            // Also fetch the global earnings multiplier to match the dashboard calculation
            const { data: config } = await supabase.from('app_config').select('global_earnings_multiplier').single();
            const multiplier = config ? Number(config.global_earnings_multiplier) : 1;

            const { data: allBatchFiles } = await supabase
                .from('files')
                .select('user_id, file_size, approved_value')
                .eq('batch_id', batchData.id);
                
            allBatchFiles?.forEach(f => {
                batchCounts[f.user_id] = (batchCounts[f.user_id] || 0) + 1;
                batchGbs[f.user_id] = (batchGbs[f.user_id] || 0) + Number(f.file_size || 0);
                
                // Dynamically calculate asset value
                const sizeInMB = Number(f.file_size || 0) / (1024 * 1024);
                const val = sizeInMB * godModeConfig.payRatePerMB * multiplier;
                batchAssetValues[f.user_id] = (batchAssetValues[f.user_id] || 0) + (f.approved_value ? Number(f.approved_value) : val);
            });
        }

        // Also fetch referral counts
        const { data: allReferrals } = await supabase
            .from('profiles')
            .select('referred_by_user_id')
            .not('referred_by_user_id', 'is', null);
            
        const referralCounts: Record<string, number> = {};
        allReferrals?.forEach(r => {
            if (r.referred_by_user_id) {
                referralCounts[r.referred_by_user_id] = (referralCounts[r.referred_by_user_id] || 0) + 1;
            }
        });

        // Extract the count from the nested relation array
        const formattedData = data?.map(user => ({
            ...user,
            calculated_earnings: batchAssetValues[user.id] !== undefined ? batchAssetValues[user.id].toFixed(2) : Number(user.calculated_earnings || 0).toFixed(2),
            files_count: user.files?.[0]?.count || 0,
            pending_files_count: pendingCounts[user.id] || 0,
            batch_files_count: batchCounts[user.id] || 0,
            batch_gbs: ((batchGbs[user.id] || 0) / (1024 * 1024 * 1024)).toFixed(2),
            referred_users_count: referralCounts[user.id] || 0,
            referral_earnings: Number(user.referral_earnings || 0).toFixed(2),
        }));

        return { success: true, data: formattedData as AdminUserStats[] };

    } catch (error: unknown) {
        console.error("Admin error fetching users:", error instanceof Error ? error.message : "Unknown");
        return { success: false, error: "Failed to fetch users." };
    }
}

/**
 * Updates a specific user's `admin_override_earnings`.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EARNINGS_OVERRIDE = 100_000; // ₹1,00,000 cap

export async function setAdminOverrideEarningsAction(userId: string, overrideValue: string | null): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        if (process.env.ENABLE_BACKEND !== 'true') {
            await new Promise((res) => setTimeout(res, 500));
            revalidatePath('/mac-sam-0005');
            return { success: true };
        }

        // Validate userId format (after god mode bypass to allow mock-user-0)
        if (!UUID_REGEX.test(userId)) {
            return { success: false, error: "Invalid user ID format" };
        }

        const supabase = await createServiceClient();
        let valueToSave = null;
        if (overrideValue && overrideValue !== "") {
            const parsed = parseFloat(overrideValue);
            if (isNaN(parsed) || parsed < 0 || !isFinite(parsed)) {
                return { success: false, error: "Override must be a positive number" };
            }
            if (parsed > MAX_EARNINGS_OVERRIDE) {
                return { success: false, error: `Override cannot exceed ₹${MAX_EARNINGS_OVERRIDE.toLocaleString()}` };
            }
            valueToSave = parsed;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ 
                admin_override_earnings: valueToSave,
                withdrawable_balance: valueToSave !== null ? valueToSave : 0
            })
            .eq('id', userId);

        if (error) throw error;

        revalidatePath('/mac-sam-0005'); // Re-run the table
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

        if (process.env.ENABLE_BACKEND !== 'true') {
            await new Promise((res) => setTimeout(res, 300));
            revalidatePath('/mac-sam-0005');
            return { success: true };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('app_config')
            .update({ global_earnings_multiplier: multiplier })
            .eq('id', 1);

        if (error) throw error;

        revalidatePath('/mac-sam-0005');
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

        if (process.env.ENABLE_BACKEND !== 'true') {
            await new Promise((res) => setTimeout(res, 300));
            revalidatePath('/mac-sam-0005');
            return { success: true };
        }

        // Validate userId format (after god mode bypass to allow mock-user-0)
        if (!UUID_REGEX.test(userId)) {
            return { success: false, error: "Invalid user ID format" };
        }

        const supabase = await createServiceClient();

        const { error } = await supabase
            .from('profiles')
            .update({ approved_for_payment: approved })
            .eq('id', userId);

        if (error) throw error;

        revalidatePath('/mac-sam-0005');
        return { success: true };

    } catch (error: unknown) {
        console.error("Toggle approval error:", error instanceof Error ? error.message : "Unknown");
        return { success: false, error: "Failed to update user approval status." };
    }
}

/**
 * Fetches network stats specifically for today.
 */
export async function getTodayNetworkStatsAction(): Promise<ActionResponse<{ totalFiles: number, uniqueContributors: number }>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        if (process.env.ENABLE_BACKEND !== 'true') {
            return {
                success: true,
                data: {
                    totalFiles: Math.floor(Math.random() * 500) + 100,
                    uniqueContributors: Math.floor(Math.random() * 20) + 5
                }
            };
        }

        const supabase = await createClient();

        // Get start of today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIso = today.toISOString();

        // 1. Get files count today
        const { count: totalFiles, error: filesErr } = await supabase
            .from('files')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayIso);

        if (filesErr) throw filesErr;

        // 2. Get unique contributors today
        // We do this by getting distinct user_ids. Supabase RPC is best, but we can just fetch and map for small scale or rely on a query.
        const { data: uploaders, error: uploaderErr } = await supabase
            .from('files')
            .select('user_id')
            .gte('created_at', todayIso);

        if (uploaderErr) throw uploaderErr;

        const uniqueContributors = new Set(uploaders?.map(u => u.user_id)).size;

        return {
            success: true,
            data: {
                totalFiles: totalFiles || 0,
                uniqueContributors
            }
        };

    } catch (error: unknown) {
        console.error("Stats fetching error:", error instanceof Error ? error.message : "Unknown");
        return { success: false, error: "Failed to fetch today's stats." };
    }
}

// ============================================================================
// FILE VERIFICATION ACTIONS
// ============================================================================

export interface PendingFile {
    id: string;
    file_name: string;
    file_size: number;
    file_category: string;
    created_at: string;
    user_id: string;
    profiles: {
        display_name: string;
        email: string;
    } | null;
}

export async function getPendingFilesAction(): Promise<ActionResponse<{ files: PendingFile[], photoCount: number, videoCount: number }>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        if (process.env.ENABLE_BACKEND !== 'true') {
            return {
                success: true,
                data: {
                    files: [],
                    photoCount: 0,
                    videoCount: 0
                }
            };
        }

        const supabase = await createClient();

        const { data: files, error } = await supabase
            .from('files')
            .select('id, file_name, file_size, file_category, created_at, user_id, profiles(display_name, email)')
            .eq('status', 'pending_review')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) throw error;

        let photoCount = 0;
        let videoCount = 0;

        files?.forEach(f => {
            if (f.file_category === 'image') photoCount++;
            if (f.file_category === 'video') videoCount++;
        });

        // Type coercion because Postgrest single relation queries return array or object depending on schema knowledge, we assume object here based on setup
        const formattedFiles = (files || []).map(f => ({
            ...f,
            profiles: Array.isArray(f.profiles) ? f.profiles[0] : f.profiles
        })) as PendingFile[];

        return {
            success: true,
            data: {
                files: formattedFiles,
                photoCount,
                videoCount
            }
        };

    } catch (error: unknown) {
        const err = error as Error;
        console.error("Fetch pending files error:", err);
        console.error("Error Message:", err?.message);
        return { success: false, error: "Failed to fetch pending files." };
    }
}

export async function approveFileAction(fileId: string): Promise<ActionResponse<{ message: string }>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        const supabase = await createClient();

        // 1. Fetch file details
        const { data: file, error: fileErr } = await supabase
            .from('files')
            .select('user_id, file_size, status')
            .eq('id', fileId)
            .single();

        if (fileErr || !file) return actionError("File not found");
        if (file.status !== 'pending_review') return actionError("File is not pending review");

        // 2. Calculate Gross Value
        const { godModeConfig } = await import('@/config/god-mode');
        const sizeMB = file.file_size / (1024 * 1024);
        const grossValue = sizeMB * godModeConfig.payRatePerMB;

        // 3. Fetch User Profile to check for referrer
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('referred_by_user_id, withdrawable_balance')
            .eq('id', file.user_id)
            .single();

        if (profileErr || !profile) return actionError("Uploader profile not found");

        // 4. Calculate Net Payouts based on God Mode Config
        const uploaderBalance = Number(profile.withdrawable_balance || 0);

        let netUploaderPayout = grossValue * (1 - godModeConfig.platformFeePercent); // Starts at 85%
        let referralBonusPayout = 0;

        if (profile.referred_by_user_id) {
            // Deduct the 15% referral bonus from the gross value to give to the referrer
            referralBonusPayout = grossValue * godModeConfig.referralBonusPercent;
            netUploaderPayout = grossValue * (1 - godModeConfig.platformFeePercent - godModeConfig.referralBonusPercent); // Down to 70%
        }

        // 5. Run Updates
        // A. Update File Status
        await supabase
            .from('files')
            .update({
                status: 'approved',
                approved_value: netUploaderPayout,
                approved_at: new Date().toISOString()
            })
            .eq('id', fileId);

        // B. Update Uploader Balance
        await supabase
            .from('profiles')
            .update({ withdrawable_balance: uploaderBalance + netUploaderPayout })
            .eq('id', file.user_id);

        // C. Update Referrer Balance (if exists)
        if (profile.referred_by_user_id && referralBonusPayout > 0) {
            // We need to fetch referrer current balances to add safely
            const { data: referrerProfile } = await supabase
                .from('profiles')
                .select('withdrawable_balance, referral_earnings')
                .eq('id', profile.referred_by_user_id)
                .single();

            if (referrerProfile) {
                await supabase
                    .from('profiles')
                    .update({
                        withdrawable_balance: Number(referrerProfile.withdrawable_balance || 0) + referralBonusPayout,
                        referral_earnings: Number(referrerProfile.referral_earnings || 0) + referralBonusPayout
                    })
                    .eq('id', profile.referred_by_user_id);
            }
        }

        revalidatePath('/mac-sam-0005');
        return actionSuccess({ message: "File approved successfully" });

    } catch (error: unknown) {
        console.error("Approve file error:", error);
        return actionError("Failed to approve file.");
    }
}

export async function approveUserFilesBulkAction(userId: string, count: number): Promise<ActionResponse<{ message: string, approvedCount: number }>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        if (!count || count <= 0) return actionError("Please specify a valid number of files to approve.");

        const supabase = await createClient();

        // 1. Fetch up to `count` pending files for this user
        const { data: files, error: filesErr } = await supabase
            .from('files')
            .select('id, file_size')
            .eq('user_id', userId)
            .eq('status', 'pending_review')
            .order('created_at', { ascending: true })
            .limit(count);

        if (filesErr) throw filesErr;
        if (!files || files.length === 0) return actionError("No pending files found for this user.");

        const { godModeConfig } = await import('@/config/god-mode');

        // 2. Fetch User Profile
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('referred_by_user_id, withdrawable_balance, calculated_earnings')
            .eq('id', userId)
            .single();

        if (profileErr || !profile) return actionError("User profile not found");

        let totalUploaderPayout = 0;
        let totalReferralPayout = 0;
        const now = new Date().toISOString();

        // Calculate payouts per file and prepare updates concurrently
        const fileUpdatePromises = files.map((file) => {
            const sizeMB = file.file_size / (1024 * 1024);
            const grossValue = sizeMB * godModeConfig.payRatePerMB;

            let netUploaderPayout = grossValue * (1 - godModeConfig.platformFeePercent);
            let referralBonusPayout = 0;

            if (profile.referred_by_user_id) {
                referralBonusPayout = grossValue * godModeConfig.referralBonusPercent;
                netUploaderPayout = grossValue * (1 - godModeConfig.platformFeePercent - godModeConfig.referralBonusPercent);
            }

            totalUploaderPayout += netUploaderPayout;
            totalReferralPayout += referralBonusPayout;

            // Immediately update the individual file concurrently
            return supabase
                .from('files')
                .update({
                    status: 'approved',
                    approved_value: netUploaderPayout,
                    approved_at: now
                })
                .eq('id', file.id);
        });

        await Promise.all(fileUpdatePromises);

        // 3. Update Uploader Balance and Calculated Earnings
        const uploaderBalance = Number(profile.withdrawable_balance || 0);
        const uploaderCalculatedEarnings = Number(profile.calculated_earnings || 0);
        await supabase
            .from('profiles')
            .update({ 
                withdrawable_balance: uploaderBalance + totalUploaderPayout,
                calculated_earnings: uploaderCalculatedEarnings + totalUploaderPayout 
            })
            .eq('id', userId);

        // 4. Update Referrer Balance
        if (profile.referred_by_user_id && totalReferralPayout > 0) {
            const { data: referrerProfile } = await supabase
                .from('profiles')
                .select('withdrawable_balance, referral_earnings')
                .eq('id', profile.referred_by_user_id)
                .single();

            if (referrerProfile) {
                await supabase
                    .from('profiles')
                    .update({
                        withdrawable_balance: Number(referrerProfile.withdrawable_balance || 0) + totalReferralPayout,
                        referral_earnings: Number(referrerProfile.referral_earnings || 0) + totalReferralPayout
                    })
                    .eq('id', profile.referred_by_user_id);
            }
        }

        revalidatePath('/mac-sam-0005');
        return actionSuccess({ message: `Successfully approved ${files.length} files`, approvedCount: files.length });

    } catch (error: unknown) {
        console.error("Bulk approve files error:", error);
        return actionError("Failed to approve files in bulk.");
    }
}

export async function rejectFileAction(fileId: string): Promise<ActionResponse<{ message: string }>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        const supabase = await createClient();

        // Check file status first just to be safe
        const { data: file } = await supabase
            .from('files')
            .select('status')
            .eq('id', fileId)
            .single();
            
        if (!file || file.status !== 'pending_review') {
            return actionError("File is not in pending review state");
        }

        const { error } = await supabase
            .from('files')
            .update({
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_value: 0
            })
            .eq('id', fileId);

        if (error) throw error;

        revalidatePath('/mac-sam-0005');
        return actionSuccess({ message: "File rejected successfully" });

    } catch (error: unknown) {
        console.error("Reject file error:", error);
        return actionError("Failed to reject file.");
    }
}

// ============================================================================
// PAYOUT MANAGEMENT ACTIONS
// ============================================================================

export interface PendingWithdrawal {
    id: string;
    user_id: string;
    amount: number;
    upi_id: string;
    status: string;
    created_at: string;
    admin_note?: string | null;
    paid_at?: string | null;
    profiles: {
        display_name: string;
        email: string;
    } | null;
}

export async function getPendingWithdrawalsAction(): Promise<ActionResponse<{ withdrawals: PendingWithdrawal[], totalAmount: number }>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        // In development, we still want to fetch actual withdrawals if testing database connection
        // Only return mock if we specifically lack Supabase credentials
        if (process.env.ENABLE_BACKEND !== 'true' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
            return {
                success: true,
                data: { withdrawals: [], totalAmount: 0 }
            };
        }

        const supabase = await createServiceClient();

        const { data: requests, error } = await supabase
            .from('withdrawal_requests')
            .select('id, user_id, amount, upi_id, status, created_at, profiles(display_name, email)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        let totalAmount = 0;
        requests?.forEach(r => {
            totalAmount += Number(r.amount);
        });

        // Type coercion
        const formattedRequests = (requests || []).map(r => ({
            ...r,
            profiles: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
        })) as PendingWithdrawal[];

        return {
            success: true,
            data: {
                withdrawals: formattedRequests,
                totalAmount
            }
        };

    } catch (error: unknown) {
        console.error("Fetch pending withdrawals error:", error);
        return { success: false, error: "Failed to fetch pending withdrawals." };
    }
}

export async function getUserWithdrawalHistoryAction(userId: string): Promise<ActionResponse<{ withdrawals: PendingWithdrawal[] }>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        const supabase = await createServiceClient();

        const { data: requests, error } = await supabase
            .from('withdrawal_requests')
            .select('id, user_id, amount, upi_id, status, created_at, admin_note, paid_at, profiles(display_name, email)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedRequests = (requests || []).map(r => ({
            ...r,
            profiles: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
        })) as PendingWithdrawal[];

        return {
            success: true,
            data: { withdrawals: formattedRequests }
        };
    } catch (error: unknown) {
        console.error("Fetch user withdrawal history error:", error);
        return { success: false, error: "Failed to fetch withdrawal history." };
    }
}

export async function markWithdrawalPaidAction(requestId: string): Promise<ActionResponse<{ message: string }>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        const supabase = await createServiceClient();

        const { error } = await supabase
            .from('withdrawal_requests')
            .update({
                status: 'paid',
                paid_at: new Date().toISOString()
            })
            .eq('id', requestId)
            .eq('status', 'pending');

        if (error) throw error;

        revalidatePath('/mac-sam-0005');
        return actionSuccess({ message: "Withdrawal marked as paid" });

    } catch (error: unknown) {
        console.error("Mark withdrawal paid error:", error);
        return actionError("Failed to update withdrawal status.");
    }
}

export async function denyWithdrawalAction(requestId: string, reason: string = ""): Promise<ActionResponse<{ message: string }>> {
    try {
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) return { success: false, error: "Unauthorized access" };

        const supabase = await createServiceClient();

        // 1. Get the withdrawal details to refund the user
        const { data: request, error: reqErr } = await supabase
            .from('withdrawal_requests')
            .select('user_id, amount, status')
            .eq('id', requestId)
            .single();

        if (reqErr || !request) return actionError("Request not found");
        if (request.status !== 'pending') return actionError("Request is not pending");

        // 2. Refund the user
        const { data: profile } = await supabase
            .from('profiles')
            .select('withdrawable_balance, admin_override_earnings')
            .eq('id', request.user_id)
            .single();

        if (profile) {
            const newBalance = Number(profile.withdrawable_balance || 0) + Number(request.amount);
            // Must update both because the dashboard reads from admin_override_earnings primarily in God Mode
            await supabase
                .from('profiles')
                .update({ 
                    withdrawable_balance: newBalance,
                    admin_override_earnings: newBalance 
                })
                .eq('id', request.user_id);
        }

        // 3. Mark as denied
        const { error: rejectErr } = await supabase
            .from('withdrawal_requests')
            .update({
                status: 'denied',
                admin_note: reason,
                paid_at: new Date().toISOString() // using paid_at as resolution timestamp
            })
            .eq('id', requestId);

        if (rejectErr) throw rejectErr;

        revalidatePath('/mac-sam-0005');
        return actionSuccess({ message: "Withdrawal denied and funds refunded" });

    } catch (error: unknown) {
        console.error("Deny withdrawal error:", error);
        return actionError("Failed to deny withdrawal.");
    }
}
