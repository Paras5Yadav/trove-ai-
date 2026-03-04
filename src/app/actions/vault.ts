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
    r2UrlOrKey: string
): Promise<ActionResponse<{ message: string } | void>> {
    try {
        // GOD MODE: If backend is disabled, returning success so the UI animations work
        if (process.env.NEXT_PUBLIC_ENABLE_BACKEND !== 'true') {
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

        // 3. Register the newly uploaded file!
        const { error: fileError } = await supabase
            .from('files')
            .insert({
                batch_id: batchId,
                user_id: user.id,
                file_name: fileName,
                file_size: fileSizeInBytes,
                r2_url: r2UrlOrKey,
                content_type: contentType,
                status: 'pending_review' // Awaiting Admin Approval
            });

        if (fileError) {
            console.error("Database Insert Error:", fileError.message);
            return actionError("Failed to save file metadata.");
        }

        // 4. Update the User's Profile Totals (Calculated Earnings)
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
            return actionError("Failed to update earnings. Please contact support.");
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
export async function getUserDashboardStatsAction(): Promise<ActionResponse<{ total_gbs: string, pending_earnings: string }>> {
    try {
        // GOD MODE SIMULATION:
        if (process.env.NEXT_PUBLIC_ENABLE_BACKEND !== 'true') {
            return actionSuccess({
                total_gbs: "0.00",
                pending_earnings: "$0.00"
            });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return actionError("Not logged in");
        }

        // 1. Get the global configurations
        const { data: config } = await supabase
            .from('app_config')
            .select('global_earnings_multiplier')
            .single();

        const multiplier = config ? Number(config.global_earnings_multiplier) : 1;

        // 2. Get the User's Profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('total_gbs_uploaded, calculated_earnings, admin_override_earnings')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            return actionError("Profile not found");
        }

        // 3. THE GOD MODE OVERRIDE LOGIC
        // If the admin typed a hard number, USE IT. Otherwise, use the automated math.
        let finalEarningsToDisplay = 0;

        if (profile.admin_override_earnings !== null) {
            finalEarningsToDisplay = Number(profile.admin_override_earnings);
        } else {
            // Apply the mass-scale Global Multiplier (e.g. 0.1 for 10%)
            finalEarningsToDisplay = Number(profile.calculated_earnings) * multiplier;
        }

        return actionSuccess({
            total_gbs: Number(profile.total_gbs_uploaded).toFixed(2),
            pending_earnings: finalEarningsToDisplay.toFixed(2)
        });

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Dashboard stats error:", error instanceof Error ? error.message : "Unknown");
        }
        return actionError("Authentication check failed");
    }
}
