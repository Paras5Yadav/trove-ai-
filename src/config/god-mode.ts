// Admin Configuration for Trove AI
// Set ENABLE_BACKEND=false in .env.local to completely bypass Supabase and R2.
// Set ENABLE_BACKEND=true to save valid user files to R2 and Supabase.

// Production safety guard — warn if deploying with backend disabled
if (
    process.env.NODE_ENV === 'production' &&
    process.env.ENABLE_BACKEND !== 'true'
) {
    console.warn(
        '🚨 WARNING: ENABLE_BACKEND is not "true" in production. ' +
        'God mode should only be used in development/staging. ' +
        'Set ENABLE_BACKEND=true in your production environment.'
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
    manualTotalPaidOut: "₹38,640",

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
    userUploadCapacityLimit: "10GB",

    // Earnings rate (in rupees) per MB (e.g. ₹0.46 per MB)
    payRatePerMB: 0.46,

    // ---------------------------------------------------------
    // PLATFORM FEES & REFERRAL
    // ---------------------------------------------------------

    // Platform fee deducted from every approved file (15%)
    platformFeePercent: 0.15,

    // Referral bonus paid to the referrer from every approved file (15%)
    referralBonusPercent: 0.15,

    // ---------------------------------------------------------
    // DISPLAY DIVISORS (Controls what the user sees on the dashboard)
    // ---------------------------------------------------------
    // Photos are divided by 2 (higher reward for live camera capture effort)
    // Video/Audio/Other are divided by 6 (protects against large file size payouts)
    displayDivisors: {
        image: 2,
        video: 6,
        audio: 6,
        default: 6,
    },
};

/**
 * Returns the correct display divisor for a given content type.
 * Photos → ÷2 (higher visible reward), Video/Audio → ÷6 (suppressed)
 */
export function getDisplayDivisor(contentType: string): number {
    if (contentType.startsWith('image/')) return godModeConfig.displayDivisors.image;
    if (contentType.startsWith('video/')) return godModeConfig.displayDivisors.video;
    if (contentType.startsWith('audio/')) return godModeConfig.displayDivisors.audio;
    return godModeConfig.displayDivisors.default;
}
