// Admin Configuration for Trove AI
// Set NEXT_PUBLIC_ENABLE_BACKEND=false in .env.local to completely bypass Supabase and R2.
// Set NEXT_PUBLIC_ENABLE_BACKEND=true to save valid user files to R2 and Supabase.

// Production safety guard — warn if deploying with backend disabled
if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_BACKEND !== 'true'
) {
    console.warn(
        '🚨 WARNING: NEXT_PUBLIC_ENABLE_BACKEND is not "true" in production. ' +
        'God mode should only be used in development/staging. ' +
        'Set NEXT_PUBLIC_ENABLE_BACKEND=true in your production environment.'
    );
}
export const godModeConfig = {
    // ---------------------------------------------------------
    // GLOBAL OVERRIDES (Applies regardless of BACKEND=true/false)
    // ---------------------------------------------------------

    // If true, the dashboard will display the manual stats below instead of the real database totals.
    // Use this to display massive numbers for marketing even if the real database is small.
    overrideGlobalStats: true,

    // The fake numbers to display when overrideGlobalStats is true:
    manualTotalFilesUploaded: "3,842+",
    manualTotalStorageUsed: "300GB",
    manualTotalPaidOut: "$420.00",

    // ---------------------------------------------------------
    // BATCH OVERRIDES
    // ---------------------------------------------------------

    // Global settings for the current active batch 
    currentBatch: {
        id: "BATCH_A204",
        name: "Human Action Videos",
        totalCapacityText: "4TB",
        // Force the progress marker. If "overrideBatchProgress" is true, the batch will always show this progress.
        // e.g. If you want to show 2TB out of 10TB filled, set this to 20%
        overrideBatchProgress: true,
        manualCapacityFilledPercentage: "7.5%",
    },

    // ---------------------------------------------------------
    // UPLOAD LIMITS & RATES
    // ---------------------------------------------------------

    // The maximum upload limit per user for the current batch
    userUploadCapacityLimit: "15GB",

    // Earnings rate (in dollars) per MB (e.g. $0.001 per MB)
    payRatePerMB: 0.005,
};
