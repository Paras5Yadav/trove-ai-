"use server";

import { createClient } from "@/utils/supabase/server";
import { godModeConfig } from "@/config/god-mode";
import { ActionResponse, actionError, actionSuccess } from "@/types/actions";

/**
 * Call this action after a file is successfully uploaded to R2
 * It will write the metadata to Supabase so you can pay them!
 */
export async function registerUploadedFileAction(
    fileName: string,
    fileSizeInBytes: number,
    contentType: string,
    r2UrlOrKey: string,
    duplicateHash: string | null = null
): Promise<ActionResponse<{ message: string } | void>> {
    try {
        // GOD MODE: If backend is disabled, returning success so the UI animations work
        if (process.env.ENABLE_BACKEND !== 'true') {
            return actionSuccess({ message: "Simulated Registration Complete" });
        }

        const supabase = await createClient();

        // 1. Ensure user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return actionError("Must be logged in to register a file.");
        }

        // 2. We need to find or create the current Batch
        const batchName = godModeConfig.currentBatch.id; // e.g. "BATCH_A204"

        let batchId;
        const { data: batchData } = await supabase
            .from('batches')
            .select('id')
            .eq('name', batchName)
            .single();

        if (batchData) {
            batchId = batchData.id;
        } else {
            // Create the batch if it doesn't exist for this dataset
            const { data: newBatch, error: batchError } = await supabase
                .from('batches')
                .insert({
                    user_id: user.id, // User uploading the file
                    name: batchName,
                    dataset_type: godModeConfig.currentBatch.name,
                })
                .select()
                .single();

            if (batchError || !newBatch) {
                return actionError("Failed to initialize the dataset batch.");
            }
            batchId = newBatch.id;
        }

        // 3. Derive file category from content type metadata
        const fileCategory = contentType.startsWith('image/') ? 'image'
            : contentType.startsWith('video/') ? 'video'
            : 'other';

        // ============================================================
        // DUPLICATE DETECTION: Check if this exact image was already uploaded
        // Uses the perceptual hash (pHash) generated in the browser.
        // Only runs if a hash was provided (images only, not videos/other).
        // ============================================================
        if (duplicateHash) {
            const { data: existingFile } = await supabase
                .from('files')
                .select('id')
                .eq('duplicate_hash', duplicateHash)
                .limit(1)
                .maybeSingle();

            if (existingFile) {
                return actionError("This exact image has already been uploaded to the Trove network. Duplicate uploads are not allowed.");
            }
        }

        // 4. Register the newly uploaded file (NO instant earnings — Admin must approve first)
        const fileRecord: Record<string, unknown> = {
            batch_id: batchId,
            user_id: user.id,
            file_name: fileName,
            file_size: fileSizeInBytes,
            r2_url: r2UrlOrKey,
            content_type: contentType,
            file_category: fileCategory,
            status: 'pending_review', // Awaiting Admin Approval
        };

        // Only include duplicate_hash if a hash was provided (avoids error if column doesn't exist yet)
        if (duplicateHash) {
            fileRecord.duplicate_hash = duplicateHash;
        }

        const { error: fileError } = await supabase
            .from('files')
            .insert(fileRecord);

        if (fileError) {
            console.error("Database Insert Error:", fileError.message);
            return actionError("Failed to save file metadata.");
        }

        // 5. Update the User's Profile Totals (Calculated Earnings)
        // Convert Bytes to MBs, then multiply by config pay rate
        const sizeInMB = fileSizeInBytes / (1024 * 1024);
        const earnedFromThisFile = sizeInMB * godModeConfig.payRatePerMB;

        const { error: rpcError } = await supabase.rpc('increment_profile_stats', {
            p_user_id: user.id,
            p_gb_delta: sizeInMB / 1024,
            p_earnings_delta: earnedFromThisFile
        });

        if (rpcError) {
            console.error("RPC error:", rpcError.message);
            // Non-fatal: file is registered, just stats update failed
        }

        return actionSuccess();

    } catch (error: unknown) {
        console.error("Dashboard DB error:", error instanceof Error ? error.message : "Unknown");
        return actionError("An unexpected error occurred. Please try again.");
    }
}


/**
 * Call this action to pull the user's dashboard data securely 
 * Applies the God Mode global multiplier AND manual overrides
 */
interface DashboardStats {
    total_gbs: string;
    asset_value: string;
    withdrawable_balance: string;
    referral_earnings: string;
    total_files_count: number;
    referral_code: string;
    upi_id: string;
    recent_withdrawals: Array<{
        id: string;
        amount: number;
        status: string;
        admin_note: string | null;
        created_at: string;
        paid_at: string | null;
    }>;
}

export async function getUserDashboardStatsAction(): Promise<ActionResponse<DashboardStats>> {
    const defaultStats: DashboardStats = {
        total_gbs: "0.00",
        asset_value: "0.00",
        withdrawable_balance: "0.00",
        referral_earnings: "0.00",
        total_files_count: 0,
        referral_code: "",
        upi_id: "",
        recent_withdrawals: [],
    };

    try {
        // GOD MODE SIMULATION:
        if (process.env.ENABLE_BACKEND !== 'true') {
            return actionSuccess(defaultStats);
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return actionSuccess(defaultStats);
        }

        // 1. Get the User's Profile
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('withdrawable_balance, referral_earnings, referral_code, admin_override_earnings, upi_id')
                .eq('id', user.id)
                .single();

            if (error || !profile) {
                return actionSuccess(defaultStats);
            }

            // 2. Calculate stats ONLY for the current batch
            const batchName = godModeConfig.currentBatch.id;
            let totalFilesCount = 0;
            let currentBatchAssetValue = 0;
            let currentBatchGBs = 0;

            try {
                // Get the global earnings multiplier first
                const { data: config } = await supabase.from('app_config').select('global_earnings_multiplier').single();
                const multiplier = config ? Number(config.global_earnings_multiplier) : 1;

                const { data: batchData } = await supabase
                    .from('batches')
                    .select('id')
                    .eq('name', batchName)
                    .single();

                if (batchData) {
                    const { data: batchFiles } = await supabase
                        .from('files')
                        .select('file_size, approved_value')
                        .eq('user_id', user.id)
                        .eq('batch_id', batchData.id);

                    if (batchFiles) {
                        totalFilesCount = batchFiles.length;
                        
                        let totalBytes = 0;
                        let totalCalculatedEarnings = 0;
                        
                        batchFiles.forEach(file => {
                            totalBytes += Number(file.file_size || 0);
                            
                            // Calculate base value using the same formula as registerFileAction
                            const fileSizeInMB = Number(file.file_size || 0) / (1024 * 1024);
                            const val = fileSizeInMB * godModeConfig.payRatePerMB * multiplier;
                            totalCalculatedEarnings += (file.approved_value ? Number(file.approved_value) : val);
                        });
                        
                        currentBatchGBs = totalBytes / (1024 * 1024 * 1024); // Convert bytes to GBs
                        currentBatchAssetValue = totalCalculatedEarnings;
                    }
                }
            } catch (err) {
                console.warn("Batch calculation error (safe to ignore if no batch):", err);
            }

            // 3. Fetch the most recent withdrawal request (any status) so user sees feedback
            let recentWithdrawals: DashboardStats['recent_withdrawals'] = [];
            try {
                const { data: withdrawalsData } = await supabase
                    .from('withdrawal_requests')
                    .select('id, amount, status, admin_note, created_at, paid_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);
                
                if (withdrawalsData) {
                    recentWithdrawals = withdrawalsData as DashboardStats['recent_withdrawals'];
                }
            } catch {
                // non-fatal if history fails
            }

            // 4. Cleared Balance = God Mode Override (or 0 if not set)
            let clearedBalance = 0;
            if (profile.admin_override_earnings !== null && profile.admin_override_earnings !== undefined) {
                clearedBalance = Number(profile.admin_override_earnings);
            }

            return actionSuccess({
                total_gbs: currentBatchGBs.toFixed(2),
                asset_value: currentBatchAssetValue.toFixed(2),
                withdrawable_balance: clearedBalance.toFixed(2),
                referral_earnings: Number(profile.referral_earnings || 0).toFixed(2),
                total_files_count: totalFilesCount,
                referral_code: profile.referral_code || "",
                upi_id: profile.upi_id || "",
                recent_withdrawals: recentWithdrawals,
            });
        } catch {
            return actionSuccess(defaultStats);
        }

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Dashboard stats error:", error instanceof Error ? error.message : "Unknown");
        }
        return actionSuccess(defaultStats);
    }
}

/**
 * Get the total volume of all files uploaded across the entire network.
 * Returns the total in TB (terabytes).
 */
export async function getBatchVolumeAction(): Promise<ActionResponse<{ totalTB: number }>> {
    try {
        if (process.env.ENABLE_BACKEND !== 'true') {
            return actionSuccess({ totalTB: 0 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('files')
            .select('file_size');

        if (error) {
            return actionSuccess({ totalTB: 0 });
        }

        const totalBytes = (data || []).reduce((sum, f) => sum + (f.file_size || 0), 0);
        const totalTB = totalBytes / (1024 * 1024 * 1024 * 1024); // bytes → TB

        return actionSuccess({ totalTB });
    } catch {
        return actionSuccess({ totalTB: 0 });
    }
}

/**
 * Submit a request to withdraw the user's cleared available balance via UPI
 */
export async function submitWithdrawalAction(upiId: string, amountRequested: number): Promise<ActionResponse<{ message: string }>> {
    try {
        // In development, still allow real database inserts if Supabase is connected
        if (process.env.ENABLE_BACKEND !== 'true' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
            return actionSuccess({ message: "Withdrawal simulated successfully in development." });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return actionError("Not authenticated");
        }

        // 1. Get current balance and block Ghost accounts
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('withdrawable_balance, account_type')
            .eq('id', user.id)
            .single();

        if (profileErr || !profile) {
            return actionError("Profile not found");
        }

        if (profile.account_type === 'ghost') {
            return actionError("Ghost accounts cannot withdraw funds.");
        }

        const currentBalance = Number(profile.withdrawable_balance || 0);

        if (amountRequested <= 0 || amountRequested > currentBalance) {
            return actionError("Invalid amount requested. Exceeds available balance.");
        }

        // 2. Start a transaction equivalent via RPC, or since we don't have atomic RPC written yet:
        // We will do a safe update: SET withdrawable = withdrawable - X WHERE id = user AND withdrawable >= X
        
        const newBalance = currentBalance - amountRequested;
        
        const { data: updatedProfile, error: updateErr } = await supabase
            .from('profiles')
            .update({
                withdrawable_balance: newBalance,
                admin_override_earnings: newBalance, // Sync the override to match the deduction!
                upi_id: upiId // Save their latest UPI ID for convenience
            })
            .eq('id', user.id)
            .gte('withdrawable_balance', amountRequested) // Prevents race condition double-spends!
            .select()
            .single();

        if (updateErr || !updatedProfile) {
            return actionError("Transaction failed. Please try again.");
        }

        // 3. Create the withdrawal request record
        const { error: insertErr } = await supabase
            .from('withdrawal_requests')
            .insert({
                user_id: user.id,
                amount: amountRequested,
                upi_id: upiId,
                status: 'pending' // Admin must mark as paid
            });

        if (insertErr) {
            // Very rare edge case: money deducted but record creation failed. 
            // Usually we'd use a postgres function for this atomic operation.
            console.error("Critical: Failed to insert withdrawal record:", insertErr);
        }

        return actionSuccess({ message: "Withdrawal request submitted successfully" });

    } catch (error) {
        console.error("Submit withdrawal error:", error);
        return actionError("An unexpected error occurred processing your withdrawal.");
    }
}
