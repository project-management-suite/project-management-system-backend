// src/controllers/fileShare.controller.js
const FileShare = require('../models/fileShare.model');
const { sendEmail } = require('../utils/mailer');
const Notification = require('../models/notification.model');
const { supabase } = require('../config/supabase');

/**
 * Share a file with a user
 */
exports.shareFile = async (req, res) => {
    try {
        const { file_id, shared_with_user_id, permission_level = 'read' } = req.body;

        if (!file_id || !shared_with_user_id) {
            return res.status(400).json({
                error: 'File ID and user ID are required'
            });
        }

        // Check if user has permission to share the file
        const fileAccess = await FileShare.checkFileAccess(file_id, req.user.user_id);

        if (fileAccess.reason === 'file_not_found') {
            return res.status(404).json({
                error: 'File not found'
            });
        }

        if (!fileAccess.hasAccess || (fileAccess.permission !== 'admin' && fileAccess.permission !== 'write')) {
            return res.status(403).json({
                error: 'You do not have permission to share this file'
            });
        }

        const share = await FileShare.shareFile({
            file_id,
            shared_with_user_id,
            shared_by_user_id: req.user.user_id,
            permission_level
        });

        // Create notification for the user receiving the file
        await Notification.create({
            user_id: shared_with_user_id,
            title: 'File Shared With You',
            message: `${req.user.username} shared a file "${share.file.file_name}" with you`,
            type: 'PROJECT_UPDATED',
            related_entity_type: 'file',
            related_entity_id: file_id
        });

        res.status(201).json({
            success: true,
            message: 'File shared successfully',
            share
        });

    } catch (error) {
        console.error('Share file error:', error);

        if (error.code === '23505') {
            return res.status(409).json({ error: 'File is already shared with this user' });
        }

        if (error.code === '23503') {
            return res.status(404).json({ error: 'File or user not found' });
        }

        res.status(500).json({ error: 'Failed to share file' });
    }
};

/**
 * Share multiple files with multiple users
 */
exports.shareBulkFiles = async (req, res) => {
    try {
        const { file_ids, user_ids, permission_level = 'read' } = req.body;

        if (!file_ids?.length || !user_ids?.length) {
            return res.status(400).json({
                error: 'File IDs and user IDs arrays are required'
            });
        }

        // Check permissions for all files
        for (const file_id of file_ids) {
            const fileAccess = await FileShare.checkFileAccess(file_id, req.user.user_id);
            if (!fileAccess.hasAccess || (fileAccess.permission !== 'admin' && fileAccess.permission !== 'write')) {
                return res.status(403).json({
                    error: `You do not have permission to share file ${file_id}`
                });
            }
        }

        const shares = await FileShare.shareBulkFiles({
            file_ids,
            user_ids,
            shared_by_user_id: req.user.user_id,
            permission_level
        });

        // Create notifications for all users
        const notifications = [];
        for (const user_id of user_ids) {
            notifications.push({
                user_id,
                title: 'Files Shared With You',
                message: `${req.user.username} shared ${file_ids.length} file(s) with you`,
                type: 'PROJECT_UPDATED'
            });
        }

        await Notification.createBulk(notifications);

        res.status(201).json({
            success: true,
            message: `Shared ${file_ids.length} file(s) with ${user_ids.length} user(s)`,
            shares,
            count: shares.length
        });

    } catch (error) {
        console.error('Bulk share files error:', error);
        res.status(500).json({ error: 'Failed to share files' });
    }
};

/**
 * Get files shared with current user
 */
exports.getSharedWithMe = async (req, res) => {
    try {
        const {
            limit = 50,
            offset = 0,
            permission_level = null,
            mime_type_filter = null
        } = req.query;

        const shares = await FileShare.getSharedWithUser(req.user.user_id, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            permission_level,
            mime_type_filter
        });

        res.json({
            success: true,
            shares,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: shares.length
            }
        });

    } catch (error) {
        console.error('Get shared with me error:', error);
        res.status(500).json({ error: 'Failed to fetch shared files' });
    }
};

/**
 * Get files shared by current user
 */
exports.getSharedByMe = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const shares = await FileShare.getSharedByUser(req.user.user_id, {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            shares,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: shares.length
            }
        });

    } catch (error) {
        console.error('Get shared by me error:', error);
        res.status(500).json({ error: 'Failed to fetch shared files' });
    }
};

/**
 * Get all shares for a specific file
 */
exports.getFileShares = async (req, res) => {
    try {
        const { fileId } = req.params;

        // Check if user has access to see file shares
        const fileAccess = await FileShare.checkFileAccess(fileId, req.user.user_id);
        if (!fileAccess.hasAccess) {
            return res.status(403).json({
                error: 'You do not have access to this file'
            });
        }

        const shares = await FileShare.getFileShares(fileId);

        res.json({
            success: true,
            shares,
            file_id: fileId,
            total_shares: shares.length
        });

    } catch (error) {
        console.error('Get file shares error:', error);
        res.status(500).json({ error: 'Failed to fetch file shares' });
    }
};

/**
 * Check file access for current user
 */
exports.checkFileAccess = async (req, res) => {
    try {
        const { fileId } = req.params;

        const access = await FileShare.checkFileAccess(fileId, req.user.user_id);

        res.json({
            success: true,
            access
        });

    } catch (error) {
        console.error('Check file access error:', error);
        res.status(500).json({ error: 'Failed to check file access' });
    }
};

/**
 * Update share permissions
 */
exports.updateSharePermission = async (req, res) => {
    try {
        const { shareId } = req.params;
        const { permission_level } = req.body;

        if (!permission_level || !['read', 'write', 'admin'].includes(permission_level)) {
            return res.status(400).json({
                error: 'Valid permission level is required (read, write, admin)'
            });
        }

        // Get share details first
        const { data: shareData, error: shareError } = await supabase
            .from('file_shares')
            .select('file_id, shared_by_user_id')
            .eq('share_id', shareId)
            .single();

        if (shareError || !shareData) {
            return res.status(404).json({ error: 'Share not found' });
        }

        // Check if user has permission to update this share
        if (shareData.shared_by_user_id !== req.user.user_id) {
            const fileAccess = await FileShare.checkFileAccess(shareData.file_id, req.user.user_id);
            if (fileAccess.permission !== 'admin') {
                return res.status(403).json({
                    error: 'You do not have permission to update this share'
                });
            }
        }

        const updatedShare = await FileShare.updateSharePermission(shareId, permission_level);

        res.json({
            success: true,
            message: 'Share permissions updated successfully',
            share: updatedShare
        });

    } catch (error) {
        console.error('Update share permission error:', error);
        res.status(500).json({ error: 'Failed to update share permissions' });
    }
};

/**
 * Remove file share
 */
exports.removeShare = async (req, res) => {
    try {
        const { shareId } = req.params;

        // Get share details first
        const { data: shareData, error: shareError } = await supabase
            .from('file_shares')
            .select('file_id, shared_by_user_id, shared_with_user_id')
            .eq('share_id', shareId)
            .single();

        if (shareError || !shareData) {
            return res.status(404).json({ error: 'Share not found' });
        }

        // Check permissions: user can remove if they shared it, received it, or have admin access to file
        const canRemove = shareData.shared_by_user_id === req.user.user_id ||
            shareData.shared_with_user_id === req.user.user_id;

        if (!canRemove) {
            const fileAccess = await FileShare.checkFileAccess(shareData.file_id, req.user.user_id);
            if (fileAccess.permission !== 'admin') {
                return res.status(403).json({
                    error: 'You do not have permission to remove this share'
                });
            }
        }

        const removedShare = await FileShare.removeShare(shareId);

        res.json({
            success: true,
            message: 'File share removed successfully',
            share: removedShare
        });

    } catch (error) {
        console.error('Remove share error:', error);
        res.status(500).json({ error: 'Failed to remove file share' });
    }
};

/**
 * Share file with entire project team
 */
exports.shareWithProjectTeam = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { permission_level = 'read' } = req.body;

        // Check if user has permission to share the file
        const fileAccess = await FileShare.checkFileAccess(fileId, req.user.user_id);
        if (!fileAccess.hasAccess || (fileAccess.permission !== 'admin' && fileAccess.permission !== 'write')) {
            return res.status(403).json({
                error: 'You do not have permission to share this file'
            });
        }

        const result = await FileShare.shareWithProjectTeam(
            fileId,
            req.user.user_id,
            permission_level
        );

        res.status(201).json({
            success: true,
            message: `File shared with ${result.shares.length} team member(s)`,
            ...result
        });

    } catch (error) {
        console.error('Share with project team error:', error);

        if (error.message.includes('not associated with a project')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to share file with project team' });
    }
};

/**
 * Get user's file sharing statistics
 */
exports.getUserSharingStats = async (req, res) => {
    try {
        const stats = await FileShare.getUserSharingStats(req.user.user_id);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get user sharing stats error:', error);
        res.status(500).json({ error: 'Failed to fetch sharing statistics' });
    }
};

/**
 * Get file sharing analytics (Admin/Manager only)
 */
exports.getSharingAnalytics = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;

        const analytics = await FileShare.getSharingAnalytics(date_from, date_to);

        res.json({
            success: true,
            analytics,
            period: {
                from: date_from || 'all time',
                to: date_to || 'present'
            }
        });

    } catch (error) {
        console.error('Get sharing analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch sharing analytics' });
    }
};

/**
 * Remove all shares for a file (Admin/Manager only)
 */
exports.removeAllFileShares = async (req, res) => {
    try {
        const { fileId } = req.params;

        // Check if user has admin permission to the file
        const fileAccess = await FileShare.checkFileAccess(fileId, req.user.user_id);
        if (fileAccess.permission !== 'admin') {
            return res.status(403).json({
                error: 'You do not have admin permission for this file'
            });
        }

        const removedShares = await FileShare.removeAllFileShares(fileId);

        res.json({
            success: true,
            message: `Removed ${removedShares.length} file share(s)`,
            removed_shares: removedShares
        });

    } catch (error) {
        console.error('Remove all file shares error:', error);
        res.status(500).json({ error: 'Failed to remove file shares' });
    }
};