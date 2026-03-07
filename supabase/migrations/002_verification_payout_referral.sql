-- =====================================================
-- Migration: Verification, Payout & Referral System
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- =====================================================

-- 1. Add new columns to `profiles` table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS withdrawable_balance DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS referral_earnings DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);

-- 2. Add new columns to `files` table
ALTER TABLE files
  ADD COLUMN IF NOT EXISTS file_category VARCHAR(10),
  ADD COLUMN IF NOT EXISTS approved_value DECIMAL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Create `withdrawal_requests` table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL NOT NULL CHECK (amount > 0),
  upi_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'denied')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- 4. RLS Policies for withdrawal_requests
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own withdrawal requests
CREATE POLICY "Users can insert own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can do everything (for admin actions)
CREATE POLICY "Service role full access to withdrawal_requests"
  ON withdrawal_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Generate unique referral codes for existing users who don't have one
-- This uses a random alphanumeric string prefixed with TRV_
UPDATE profiles
SET referral_code = 'TRV_' || upper(substr(md5(random()::text), 1, 6))
WHERE referral_code IS NULL;

-- 6. Create a function to auto-generate referral codes on new user creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'TRV_' || upper(substr(md5(random()::text), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS trigger_generate_referral_code ON profiles;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();
