-- Migration: Add Profile Photo Support
-- Created: 2025-11-30
-- Description: Add profile photo functionality with upload, update, and delete capabilities

-- Add profile_photo columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS profile_photo_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS profile_photo_uploaded_at TIMESTAMPTZ;

-- Create profile_photos table for tracking photo history and metadata
CREATE TABLE IF NOT EXISTS profile_photos (
    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_current BOOLEAN DEFAULT TRUE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one current photo per user
    CONSTRAINT unique_current_photo_per_user UNIQUE(user_id) DEFERRABLE INITIALLY DEFERRED
);

-- Remove unique constraint temporarily to allow multiple photos with is_current=false
ALTER TABLE profile_photos DROP CONSTRAINT IF EXISTS unique_current_photo_per_user;

-- Add partial unique index for current photos only
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_photos_current_user 
ON profile_photos(user_id) WHERE is_current = TRUE;

-- Function to update profile photo
CREATE OR REPLACE FUNCTION update_user_profile_photo(
    p_user_id UUID,
    p_file_name VARCHAR(255),
    p_file_path VARCHAR(500),
    p_file_url VARCHAR(500),
    p_file_size INTEGER,
    p_mime_type VARCHAR(100)
)
RETURNS UUID AS $$
DECLARE
    photo_id UUID;
BEGIN
    -- Mark all existing photos as not current
    UPDATE profile_photos 
    SET is_current = FALSE 
    WHERE user_id = p_user_id AND is_current = TRUE;
    
    -- Insert new photo record
    INSERT INTO profile_photos (
        user_id, file_name, file_path, file_url, file_size, mime_type, is_current
    ) VALUES (
        p_user_id, p_file_name, p_file_path, p_file_url, p_file_size, p_mime_type, TRUE
    ) RETURNING profile_photos.photo_id INTO photo_id;
    
    -- Update profiles table with new photo info
    UPDATE profiles 
    SET 
        profile_photo_url = p_file_url,
        profile_photo_path = p_file_path,
        profile_photo_uploaded_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN photo_id;
END;
$$ LANGUAGE plpgsql;

-- Function to remove profile photo
CREATE OR REPLACE FUNCTION remove_user_profile_photo(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Mark all photos as not current
    UPDATE profile_photos 
    SET is_current = FALSE 
    WHERE user_id = p_user_id AND is_current = TRUE;
    
    -- Clear photo info from profiles table
    UPDATE profiles 
    SET 
        profile_photo_url = NULL,
        profile_photo_path = NULL,
        profile_photo_uploaded_at = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old profile photos (keep last 5 per user)
CREATE OR REPLACE FUNCTION cleanup_old_profile_photos()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete old photos, keeping only the 5 most recent per user
    WITH photos_to_delete AS (
        SELECT photo_id
        FROM (
            SELECT photo_id,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY uploaded_at DESC) as rn
            FROM profile_photos
            WHERE is_current = FALSE
        ) ranked_photos
        WHERE rn > 5
    )
    DELETE FROM profile_photos 
    WHERE photo_id IN (SELECT photo_id FROM photos_to_delete);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON profile_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_uploaded_at ON profile_photos(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_profiles_photo_url ON profiles(profile_photo_url) WHERE profile_photo_url IS NOT NULL;

-- Add RLS (Row Level Security) policies for profile photos
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own photos
CREATE POLICY "Users can view own profile photos" ON profile_photos
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own photos
CREATE POLICY "Users can upload own profile photos" ON profile_photos
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own photos
CREATE POLICY "Users can update own profile photos" ON profile_photos
    FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own profile photos" ON profile_photos
    FOR DELETE USING (user_id = auth.uid());

-- Insert some sample data for existing users (optional)
-- This will be handled by the application when users upload photos

COMMENT ON TABLE profile_photos IS 'Stores profile photo metadata and history for users';
COMMENT ON COLUMN profiles.profile_photo_url IS 'Current profile photo public URL';
COMMENT ON COLUMN profiles.profile_photo_path IS 'Current profile photo file path for deletion';
COMMENT ON COLUMN profiles.profile_photo_uploaded_at IS 'When current profile photo was uploaded';
COMMENT ON FUNCTION update_user_profile_photo IS 'Updates user profile photo and maintains history';
COMMENT ON FUNCTION remove_user_profile_photo IS 'Removes current profile photo for user';
COMMENT ON FUNCTION cleanup_old_profile_photos IS 'Cleans up old profile photos, keeping last 5 per user';