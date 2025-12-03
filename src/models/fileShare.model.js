// src/models/fileShare.model.js
const { supabase } = require('../config/supabase');

class FileShare {
    constructor(data = {}) {
        this.share_id = data.share_id;
        this.file_id = data.file_id;
        this.shared_with_user_id = data.shared_with_user_id;
        this.shared_by_user_id = data.shared_by_user_id;
        this.permission_level = data.permission_level || 'read';
        this.shared_at = data.shared_at;
    }

    /**
     * Share a file with a user
     */
    static async shareFile(shareData) {
        const { data, error } = await supabase
            .from('file_shares')
            .insert({
                file_id: shareData.file_id,
                shared_with_user_id: shareData.shared_with_user_id,
                shared_by_user_id: shareData.shared_by_user_id,
                permission_level: shareData.permission_level || 'read'
            })
            .select(`
        *,
        file:files(
          file_id, file_name, file_size, mime_type, upload_date,
          project:projects(project_id, project_name),
          task:tasks(task_id, title)
        ),
        shared_with:profiles!file_shares_shared_with_user_id_fkey(
          user_id, username, email
        ),
        shared_by:profiles!file_shares_shared_by_user_id_fkey(
          user_id, username, email
        )
      `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Share multiple files with multiple users
     */
    static async shareBulkFiles(bulkShareData) {
        const { file_ids, user_ids, shared_by_user_id, permission_level = 'read' } = bulkShareData;

        const shares = [];
        for (const file_id of file_ids) {
            for (const user_id of user_ids) {
                shares.push({
                    file_id,
                    shared_with_user_id: user_id,
                    shared_by_user_id,
                    permission_level
                });
            }
        }

        const { data, error } = await supabase
            .from('file_shares')
            .insert(shares)
            .select(`
        *,
        file:files(file_id, file_name, file_size),
        shared_with:profiles!file_shares_shared_with_user_id_fkey(
          user_id, username, email
        )
      `);

        if (error) throw error;
        return data;
    }

    /**
     * Get files shared with a user
     */
    static async getSharedWithUser(userId, options = {}) {
        const {
            limit = 50,
            offset = 0,
            permission_level = null,
            mime_type_filter = null
        } = options;

        let query = supabase
            .from('file_shares')
            .select(`
        *,
        file:files(
          file_id, file_name, file_size, mime_type, upload_date,
          uploader:profiles!files_uploaded_by_user_id_fkey(
            user_id, username
          ),
          project:projects(project_id, project_name),
          task:tasks(task_id, title)
        ),
        shared_by:profiles!file_shares_shared_by_user_id_fkey(
          user_id, username
        )
      `)
            .eq('shared_with_user_id', userId)
            .order('shared_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (permission_level) {
            query = query.eq('permission_level', permission_level);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Filter by MIME type if specified
        if (mime_type_filter) {
            return data.filter(share =>
                share.file?.mime_type?.includes(mime_type_filter)
            );
        }

        return data;
    }

    /**
     * Get files shared by a user
     */
    static async getSharedByUser(userId, options = {}) {
        const { limit = 50, offset = 0 } = options;

        const { data, error } = await supabase
            .from('file_shares')
            .select(`
        *,
        file:files(file_id, file_name, file_size, mime_type, upload_date),
        shared_with:profiles!file_shares_shared_with_user_id_fkey(
          user_id, username, email
        )
      `)
            .eq('shared_by_user_id', userId)
            .order('shared_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data;
    }

    /**
     * Get all shares for a specific file
     */
    static async getFileShares(fileId) {
        const { data, error } = await supabase
            .from('file_shares')
            .select(`
        *,
        shared_with:profiles!file_shares_shared_with_user_id_fkey(
          user_id, username, email
        ),
        shared_by:profiles!file_shares_shared_by_user_id_fkey(
          user_id, username
        )
      `)
            .eq('file_id', fileId)
            .order('shared_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Check if user has access to a file
     */
    static async checkFileAccess(fileId, userId) {
        // First check if user is the file owner
        const { data: fileData, error: fileError } = await supabase
            .from('files')
            .select('uploaded_by_user_id, project:projects(owner_manager_id)')
            .eq('file_id', fileId)
            .single();

        if (fileError) {
            if (fileError.code === 'PGRST116') {
                // File not found
                return {
                    hasAccess: false,
                    permission: null,
                    reason: 'file_not_found'
                };
            }
            throw fileError;
        }

        // User is file owner or project owner
        if (fileData.uploaded_by_user_id === userId ||
            fileData.project?.owner_manager_id === userId) {
            return {
                hasAccess: true,
                permission: 'admin',
                reason: 'owner'
            };
        }

        // Check if file is shared with user
        const { data: shareData, error: shareError } = await supabase
            .from('file_shares')
            .select('permission_level')
            .eq('file_id', fileId)
            .eq('shared_with_user_id', userId)
            .single();

        if (shareError && shareError.code !== 'PGRST116') throw shareError;

        if (shareData) {
            return {
                hasAccess: true,
                permission: shareData.permission_level,
                reason: 'shared'
            };
        }

        return { hasAccess: false, permission: null, reason: 'no_access' };
    }

    /**
     * Update file share permissions
     */
    static async updateSharePermission(shareId, newPermission) {
        const { data, error } = await supabase
            .from('file_shares')
            .update({ permission_level: newPermission })
            .eq('share_id', shareId)
            .select(`
        *,
        file:files(file_id, file_name),
        shared_with:profiles!file_shares_shared_with_user_id_fkey(
          user_id, username, email
        )
      `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Remove file share
     */
    static async removeShare(shareId) {
        const { data, error } = await supabase
            .from('file_shares')
            .delete()
            .eq('share_id', shareId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Remove all shares for a file
     */
    static async removeAllFileShares(fileId) {
        const { data, error } = await supabase
            .from('file_shares')
            .delete()
            .eq('file_id', fileId)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Get sharing statistics for a user
     */
    static async getUserSharingStats(userId) {
        // Files shared by user
        const { data: sharedByData, error: sharedByError } = await supabase
            .from('file_shares')
            .select('share_id, permission_level')
            .eq('shared_by_user_id', userId);

        if (sharedByError) throw sharedByError;

        // Files shared with user
        const { data: sharedWithData, error: sharedWithError } = await supabase
            .from('file_shares')
            .select('share_id, permission_level')
            .eq('shared_with_user_id', userId);

        if (sharedWithError) throw sharedWithError;

        const stats = {
            files_shared_by_user: sharedByData.length,
            files_shared_with_user: sharedWithData.length,
            permissions_granted: {
                read: sharedByData.filter(s => s.permission_level === 'read').length,
                write: sharedByData.filter(s => s.permission_level === 'write').length,
                admin: sharedByData.filter(s => s.permission_level === 'admin').length
            },
            permissions_received: {
                read: sharedWithData.filter(s => s.permission_level === 'read').length,
                write: sharedWithData.filter(s => s.permission_level === 'write').length,
                admin: sharedWithData.filter(s => s.permission_level === 'admin').length
            }
        };

        return stats;
    }

    /**
     * Get file sharing analytics (Admin/Manager only)
     */
    static async getSharingAnalytics(dateFrom, dateTo) {
        let query = supabase
            .from('file_shares')
            .select(`
        share_id, permission_level, shared_at,
        file:files(file_id, file_size, mime_type)
      `);

        if (dateFrom) {
            query = query.gte('shared_at', dateFrom);
        }
        if (dateTo) {
            query = query.lte('shared_at', dateTo);
        }

        const { data, error } = await query;
        if (error) throw error;

        const analytics = {
            total_shares: data.length,
            by_permission: {
                read: data.filter(s => s.permission_level === 'read').length,
                write: data.filter(s => s.permission_level === 'write').length,
                admin: data.filter(s => s.permission_level === 'admin').length
            },
            by_file_type: {},
            total_data_shared: 0
        };

        // Group by file type and calculate total data shared
        data.forEach(share => {
            if (share.file?.mime_type) {
                const fileType = share.file.mime_type.split('/')[0];
                analytics.by_file_type[fileType] =
                    (analytics.by_file_type[fileType] || 0) + 1;
            }

            if (share.file?.file_size) {
                analytics.total_data_shared += share.file.file_size;
            }
        });

        return analytics;
    }

    /**
     * Share file with project team
     */
    static async shareWithProjectTeam(fileId, sharedByUserId, permissionLevel = 'read', projectId = null) {
        let targetProjectId = projectId;

        // If no specific project ID is provided, get the file's project
        if (!targetProjectId) {
            const { data: fileData, error: fileError } = await supabase
                .from('files')
                .select('project_id')
                .eq('file_id', fileId)
                .single();

            if (fileError) throw fileError;
            targetProjectId = fileData.project_id;
        }

        if (!targetProjectId) {
            throw new Error('File is not associated with a project and no project specified');
        }

        // Get project team members from project_members table
        const { data: teamMembers, error: teamError } = await supabase
            .from('project_members')
            .select(`
                member_id,
                project:projects!inner(
                    project_id,
                    owner_manager_id
                )
            `)
            .eq('project_id', targetProjectId);

        if (teamError) throw teamError;

        // Collect unique team member IDs
        const teamMemberIds = new Set();

        // Add project owner if available
        if (teamMembers.length > 0 && teamMembers[0].project.owner_manager_id) {
            teamMemberIds.add(teamMembers[0].project.owner_manager_id);
        }

        // Add all project members
        teamMembers.forEach(member => {
            if (member.member_id) {
                teamMemberIds.add(member.member_id);
            }
        });

        // Remove the person sharing the file
        teamMemberIds.delete(sharedByUserId);

        if (teamMemberIds.size === 0) {
            return { success: true, shares: [], message: 'No team members to share with' };
        }

        // Create shares for all team members
        const shares = Array.from(teamMemberIds).map(userId => ({
            file_id: fileId,
            shared_with_user_id: userId,
            shared_by_user_id: sharedByUserId,
            permission_level: permissionLevel
        }));

        const { data, error } = await supabase
            .from('file_shares')
            .insert(shares)
            .select(`
        *,
        shared_with:profiles!file_shares_shared_with_user_id_fkey(
          user_id, username, email
        )
      `);

        if (error) throw error;
        return { success: true, shares: data };
    }
}

module.exports = FileShare;