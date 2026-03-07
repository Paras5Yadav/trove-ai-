-- ==============================================================================
-- MIGRATION: 003_sync_calculated_earnings_with_withdrawable_balance.sql
-- Description:
-- When shifting to the admin-verification flow, the user's dashboard was 
-- updated to show `withdrawable_balance`, but the Admin UI still shows
-- `calculated_earnings`. This script ensures that `calculated_earnings`
-- exactly matches `withdrawable_balance` for existing users so the numbers
-- align perfectly on both the user dashboard and the admin console.
-- ==============================================================================

-- 1. Sync the calculated_earnings column up with the available balance
UPDATE public.profiles
SET calculated_earnings = COALESCE(withdrawable_balance, 0);

-- Note: The admin God Mode override still overrides BOTH of these values 
-- everywhere in the UI, so it does not need to be touched.
