-- Add ACCOUNT_DELETION type to email_otps type constraint
-- This allows account deletion OTP verification

-- Drop the existing constraint
ALTER TABLE email_otps DROP CONSTRAINT IF EXISTS email_otps_type_check;

-- Add the new constraint with ACCOUNT_DELETION included
ALTER TABLE email_otps 
ADD CONSTRAINT email_otps_type_check 
CHECK (type IN ('REGISTRATION', 'PASSWORD_RESET', 'ACCOUNT_DELETION'));
