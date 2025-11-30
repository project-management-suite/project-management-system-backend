-- Create email_otps table for OTP verification
CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pending_registrations table for storing user data during verification
CREATE TABLE IF NOT EXISTS pending_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    user_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_otp ON email_otps(email, otp);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON pending_registrations(email);

-- Add email_verified column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- RLS policies for email_otps table
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all OTP records
CREATE POLICY "Service role can manage email_otps" ON email_otps
    FOR ALL USING (auth.role() = 'service_role');

-- Allow service role to manage all pending registrations
CREATE POLICY "Service role can manage pending_registrations" ON pending_registrations
    FOR ALL USING (auth.role() = 'service_role');