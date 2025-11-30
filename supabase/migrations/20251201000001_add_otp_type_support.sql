-- Add type column to email_otps table for supporting different OTP types
-- This allows us to distinguish between registration OTPs and password reset OTPs

-- Add type column with default value for existing records
ALTER TABLE email_otps 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'REGISTRATION' 
CHECK (type IN ('REGISTRATION', 'PASSWORD_RESET'));

-- Create index for faster lookups by type
CREATE INDEX IF NOT EXISTS idx_email_otps_type ON email_otps(email, type);

-- Update existing records to have the correct type (they're all registration OTPs)
UPDATE email_otps SET type = 'REGISTRATION' WHERE type IS NULL;

-- Make type NOT NULL after setting default values
ALTER TABLE email_otps ALTER COLUMN type SET NOT NULL;