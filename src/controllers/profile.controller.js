// src/controllers/profile.controller.js
const { supabase } = require('../config/supabase');
const multer = require('multer');
const crypto = require('crypto');

// Configure multer for memory storage (we'll upload to Supabase)
const storage = multer.memoryStorage();

// File filter for profile photos
const fileFilter = (req, file, cb) => {
    // Accept only image files
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 1 // Only one file at a time
    }
});

// Middleware for handling photo upload
exports.uploadMiddleware = upload.single('profilePhoto');

/**
 * Get user profile with current photo
 */
exports.getProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.user_id;

        // Check if user can view this profile
        if (userId !== req.user.user_id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied to this profile' });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select(`
        user_id,
        username, 
        email,
        role,
        profile_photo_url,
        profile_photo_uploaded_at,
        created_at,
        updated_at
      `)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Profile not found' });
            }
            throw error;
        }

        res.json({
            success: true,
            profile
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to retrieve profile' });
    }
};

/**
 * Upload profile photo
 */
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo file provided' });
        }

        const userId = req.user.user_id;
        const file = req.file;

        // Generate unique filename for Supabase Storage
        const uniqueSuffix = Date.now() + '_' + crypto.randomUUID().slice(0, 8);
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${userId}_${uniqueSuffix}.${fileExtension}`;
        const filePath = `profile-photos/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error('Failed to upload file to storage');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath);

        const photoUrl = urlData.publicUrl;

        // Update database using the stored function
        const { data, error } = await supabase.rpc('update_user_profile_photo', {
            p_user_id: userId,
            p_file_name: file.originalname,
            p_file_path: filePath,
            p_file_url: photoUrl,
            p_file_size: file.size,
            p_mime_type: file.mimetype
        });

        if (error) throw error;

        // Get updated profile info
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, username, profile_photo_url, profile_photo_uploaded_at')
            .eq('user_id', userId)
            .single();

        if (profileError) throw profileError;

        res.json({
            success: true,
            message: 'Profile photo uploaded successfully',
            profile: {
                user_id: profile.user_id,
                username: profile.username,
                profile_photo_url: profile.profile_photo_url,
                profile_photo_uploaded_at: profile.profile_photo_uploaded_at
            }
        });

    } catch (error) {
        console.error('Upload profile photo error:', error);

        if (error.message.includes('Invalid file type')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to upload profile photo' });
    }
};

/**
 * Update profile photo (replace existing)
 */
exports.updateProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo file provided' });
        }

        const userId = req.user.user_id;
        const file = req.file;

        // Get current photo info to delete old file from Supabase Storage
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('profile_photo_path')
            .eq('user_id', userId)
            .single();

        // Delete old photo file from Supabase Storage if exists
        if (currentProfile && currentProfile.profile_photo_path) {
            const { error: deleteError } = await supabase.storage
                .from('uploads')
                .remove([currentProfile.profile_photo_path]);

            if (deleteError) {
                console.error('Failed to delete old photo from storage:', deleteError);
                // Continue with upload even if old file deletion fails
            }
        }

        // Upload new photo
        const uniqueSuffix = Date.now() + '_' + crypto.randomUUID().slice(0, 8);
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${userId}_${uniqueSuffix}.${fileExtension}`;
        const filePath = `profile-photos/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error('Failed to upload file to storage');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath);

        const photoUrl = urlData.publicUrl;

        const { data, error } = await supabase.rpc('update_user_profile_photo', {
            p_user_id: userId,
            p_file_name: file.originalname,
            p_file_path: filePath,
            p_file_url: photoUrl,
            p_file_size: file.size,
            p_mime_type: file.mimetype
        });

        if (error) throw error;

        // Get updated profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_id, username, profile_photo_url, profile_photo_uploaded_at')
            .eq('user_id', userId)
            .single();

        if (profileError) throw profileError;

        res.json({
            success: true,
            message: 'Profile photo updated successfully',
            profile
        });

    } catch (error) {
        console.error('Update profile photo error:', error);
        res.status(500).json({ error: 'Failed to update profile photo' });
    }
};

/**
 * Remove profile photo
 */
exports.removeProfilePhoto = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Get current photo info
        const { data: profile } = await supabase
            .from('profiles')
            .select('profile_photo_path')
            .eq('user_id', userId)
            .single();

        if (!profile || !profile.profile_photo_path) {
            return res.status(404).json({ error: 'No profile photo to remove' });
        }

        // Remove from database
        const { data, error } = await supabase.rpc('remove_user_profile_photo', {
            p_user_id: userId
        });

        if (error) throw error;

        // Delete file from Supabase Storage
        const { error: deleteError } = await supabase.storage
            .from('uploads')
            .remove([profile.profile_photo_path]);

        if (deleteError) {
            console.error('Failed to delete photo from storage:', deleteError);
            // Continue even if file deletion fails - database is already updated
        }

        res.json({
            success: true,
            message: 'Profile photo removed successfully'
        });

    } catch (error) {
        console.error('Remove profile photo error:', error);
        res.status(500).json({ error: 'Failed to remove profile photo' });
    }
};

/**
 * Get profile photo history
 */
exports.getPhotoHistory = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { data: photos, error } = await supabase
            .from('profile_photos')
            .select('photo_id, file_name, file_url, file_size, mime_type, is_current, uploaded_at')
            .eq('user_id', userId)
            .order('uploaded_at', { ascending: false })
            .limit(10); // Limit to last 10 photos

        if (error) throw error;

        res.json({
            success: true,
            photos: photos || []
        });

    } catch (error) {
        console.error('Get photo history error:', error);
        res.status(500).json({ error: 'Failed to retrieve photo history' });
    }
};

/**
 * Admin function to cleanup old profile photos
 */
exports.cleanupOldPhotos = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { data: deletedCount, error } = await supabase.rpc('cleanup_old_profile_photos');

        if (error) throw error;

        res.json({
            success: true,
            message: `Cleaned up ${deletedCount || 0} old profile photos`,
            removed: deletedCount || 0
        });

    } catch (error) {
        console.error('Cleanup old photos error:', error);
        res.status(500).json({ error: 'Failed to cleanup old photos' });
    }
};

/**
 * Admin function to cleanup sample profile photos from storage (for testing)
 */
exports.cleanupSamplePhotos = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Only allow in development/test environments
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Sample photo cleanup not allowed in production' });
        }

        console.log('🧹 Starting sample profile photos cleanup...');

        // Get all files in profile-photos folder
        const { data: files, error: listError } = await supabase.storage
            .from('uploads')
            .list('profile-photos', {
                limit: 1000,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (listError) {
            console.error('Error listing profile photos:', listError);
            throw listError;
        }

        console.log(`📁 Found ${files?.length || 0} files in profile-photos folder`);

        if (!files || files.length === 0) {
            return res.json({
                success: true,
                message: 'No sample profile photos found to delete',
                removed: 0
            });
        }

        // Delete all files from storage
        const filesToDelete = files.map(file => `profile-photos/${file.name}`);

        console.log(`🗑️ Deleting ${filesToDelete.length} profile photos from storage...`);

        const { data: deletedFiles, error: deleteError } = await supabase.storage
            .from('uploads')
            .remove(filesToDelete);

        if (deleteError) {
            console.error('Error deleting profile photos:', deleteError);
            throw deleteError;
        }

        // Also clear profile_photo_url from all users
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                profile_photo_url: null,
                profile_photo_uploaded_at: null
            })
            .not('profile_photo_url', 'is', null);

        if (updateError) {
            console.warn('Warning: Failed to clear profile photo URLs from database:', updateError);
        }

        console.log(`✅ Successfully deleted ${deletedFiles?.length || 0} profile photos`);

        res.json({
            success: true,
            message: `Cleaned up ${deletedFiles?.length || 0} sample profile photos from storage`,
            removed: deletedFiles?.length || 0
        });

    } catch (error) {
        console.error('Cleanup sample photos error:', error);
        res.status(500).json({ error: 'Failed to cleanup sample photos', details: error.message });
    }
};