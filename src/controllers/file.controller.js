// src/controllers/file.controller.js
const { supabase } = require('../config/supabase');
const File = require('../models/file.model');
const multer = require('multer');
const crypto = require('crypto');

// Configure multer for memory storage (we'll upload to Supabase)
const storage = multer.memoryStorage();

// File filter for project files - Accept all file types
const fileFilter = (req, file, cb) => {
  // Accept ALL file types - no restrictions
  // This allows maximum flexibility for project file uploads
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10 // Up to 10 files at once
  }
});

// Middleware for handling file uploads
exports.uploadMiddleware = upload.array('files', 10);

/**
 * Upload files to a project
 */
exports.uploadProjectFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const { project_id } = req.params;
    const { task_id } = req.body; // Optional: associate with specific task
    const userId = req.user.user_id;

    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id, project_name, owner_manager_id')
      .eq('project_id', project_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions
    const isManager = project.owner_manager_id === userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isManager && !isAdmin) {
      // Check if developer is assigned to the project
      const { data: assignment } = await supabase
        .from('task_assignments')
        .select('assignment_id')
        .eq('developer_id', userId)
        .in('task_id',
          supabase.from('tasks').select('task_id').eq('project_id', project_id)
        )
        .limit(1);

      if (!assignment || assignment.length === 0) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    const uploadedFiles = [];
    const uploadErrors = [];

    // Process each file
    for (const file of req.files) {
      try {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '_' + crypto.randomUUID().slice(0, 8);
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileExtension = sanitizedOriginalName.split('.').pop();
        const fileNameWithoutExt = sanitizedOriginalName.replace(/\.[^/.]+$/, "");
        const fileName = `${fileNameWithoutExt}_${uniqueSuffix}.${fileExtension}`;

        // Determine folder based on file type
        let folder = 'project-files';
        if (task_id) {
          folder = 'task-attachments';
        }

        const filePath = `${folder}/${project_id}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          uploadErrors.push({
            filename: file.originalname,
            error: uploadError.message
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        // Save file metadata to database
        const fileRecord = await File.create({
          project_id,
          task_id: task_id || null,
          uploaded_by_user_id: userId,
          file_name: file.originalname,
          file_path_in_storage: filePath,
          file_size: file.size,
          mime_type: file.mimetype
        });

        uploadedFiles.push({
          file_id: fileRecord.file_id,
          file_name: file.originalname,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.mimetype,
          upload_date: fileRecord.upload_date
        });

      } catch (fileError) {
        uploadErrors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      uploaded_files: uploadedFiles,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined
    });

  } catch (error) {
    console.error('Upload project files error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
};

/**
 * Get files for a project
 */
exports.getProjectFiles = async (req, res) => {
  try {
    const { project_id } = req.params;
    const userId = req.user.user_id;

    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id, owner_manager_id')
      .eq('project_id', project_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions (same logic as upload)
    const isManager = project.owner_manager_id === userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isManager && !isAdmin) {
      const { data: assignment } = await supabase
        .from('task_assignments')
        .select('assignment_id')
        .eq('developer_id', userId)
        .in('task_id',
          supabase.from('tasks').select('task_id').eq('project_id', project_id)
        )
        .limit(1);

      if (!assignment || assignment.length === 0) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }
    }

    const files = await File.findByProject(project_id);

    // Add download URLs
    const filesWithUrls = files.map(file => ({
      ...file,
      download_url: supabase.storage.from('uploads').getPublicUrl(file.file_path_in_storage).data.publicUrl
    }));

    res.json({
      success: true,
      files: filesWithUrls
    });

  } catch (error) {
    console.error('Get project files error:', error);
    res.status(500).json({ error: 'Failed to retrieve project files' });
  }
};

/**
 * Get files for a specific task
 */
exports.getTaskFiles = async (req, res) => {
  try {
    const { task_id } = req.params;
    const userId = req.user.user_id;

    // Verify task access
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('task_id, project_id')
      .eq('task_id', task_id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check project permissions
    const { data: project } = await supabase
      .from('projects')
      .select('owner_manager_id')
      .eq('project_id', task.project_id)
      .single();

    const isManager = project?.owner_manager_id === userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isManager && !isAdmin) {
      const { data: assignment } = await supabase
        .from('task_assignments')
        .select('assignment_id')
        .eq('task_id', task_id)
        .eq('developer_id', userId)
        .limit(1);

      if (!assignment || assignment.length === 0) {
        return res.status(403).json({ error: 'Access denied to this task' });
      }
    }

    const files = await File.findByTask(task_id);

    const filesWithUrls = files.map(file => ({
      ...file,
      download_url: supabase.storage.from('uploads').getPublicUrl(file.file_path_in_storage).data.publicUrl
    }));

    res.json({
      success: true,
      files: filesWithUrls
    });

  } catch (error) {
    console.error('Get task files error:', error);
    res.status(500).json({ error: 'Failed to retrieve task files' });
  }
};

/**
 * Get all files for the user (based on their access)
 */
exports.getAllFiles = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('files')
      .select(`
                *,
                uploader:profiles!files_uploaded_by_user_id_fkey(username, email),
                project:projects(project_name),
                task:tasks(title)
            `)
      .order('upload_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply role-based filtering
    if (req.user.role === 'ADMIN') {
      // Admin can see all files - no additional filtering
    } else if (req.user.role === 'MANAGER') {
      // Managers see files from their projects
      const { data: managerProjects, error: mgError } = await supabase
        .from('projects')
        .select('project_id')
        .eq('owner_manager_id', userId);

      if (mgError) throw mgError;

      const projectIds = managerProjects.map(p => p.project_id);

      if (projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      } else {
        return res.json({ success: true, files: [] });
      }
    } else {
      // Developers see files from projects they're assigned to
      const { data: developerProjects, error: devError } = await supabase
        .from('tasks')
        .select('project_id')
        .in('task_id',
          supabase.from('task_assignments').select('task_id').eq('developer_id', userId)
        );

      if (devError) throw devError;

      const projectIds = [...new Set(developerProjects.map(p => p.project_id))];

      if (projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      } else {
        // No projects assigned, return empty result
        return res.json({ success: true, files: [] });
      }
    } const { data: files, error } = await query;

    if (error) throw error;

    const filesWithUrls = files.map(file => ({
      ...file,
      download_url: supabase.storage.from('uploads').getPublicUrl(file.file_path_in_storage).data.publicUrl
    }));

    res.json({
      success: true,
      files: filesWithUrls
    });

  } catch (error) {
    console.error('Get all files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
};

/**
 * Get file metadata by ID
 */
exports.getFileById = async (req, res) => {
  try {
    const { file_id } = req.params;
    const userId = req.user.user_id;

    const file = await File.findById(file_id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check access permissions
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = file.uploaded_by_user_id === userId;

    if (!isAdmin && !isOwner) {
      // Check project access
      const { data: project } = await supabase
        .from('projects')
        .select('owner_manager_id')
        .eq('project_id', file.project_id)
        .single();

      const isManager = project?.owner_manager_id === userId;

      if (!isManager) {
        const { data: assignment } = await supabase
          .from('task_assignments')
          .select('assignment_id')
          .eq('developer_id', userId)
          .in('task_id',
            supabase.from('tasks').select('task_id').eq('project_id', file.project_id)
          )
          .limit(1);

        if (!assignment || assignment.length === 0) {
          return res.status(403).json({ error: 'Access denied to this file' });
        }
      }
    }

    const fileWithUrl = {
      ...file,
      download_url: supabase.storage.from('uploads').getPublicUrl(file.file_path_in_storage).data.publicUrl
    };

    res.json({
      success: true,
      file: fileWithUrl
    });

  } catch (error) {
    console.error('Get file by ID error:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
};

/**
 * Delete a file
 */
exports.deleteFile = async (req, res) => {
  try {
    const { file_id } = req.params;
    const userId = req.user.user_id;

    const file = await File.findById(file_id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check delete permissions
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = file.uploaded_by_user_id === userId;

    if (!isAdmin && !isOwner) {
      // Check if user is manager of the project
      const { data: project } = await supabase
        .from('projects')
        .select('owner_manager_id')
        .eq('project_id', file.project_id)
        .single();

      const isManager = project?.owner_manager_id === userId;

      if (!isManager) {
        return res.status(403).json({ error: 'Access denied. Only file uploader, project manager, or admin can delete files' });
      }
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('uploads')
      .remove([file.file_path_in_storage]);

    if (deleteError) {
      console.error('Failed to delete file from storage:', deleteError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await File.delete(file_id);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

/**
 * Get file statistics for admin/manager
 */
exports.getFileStats = async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (req.user.role === 'DEVELOPER') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let projectFilter = '';
    if (req.user.role === 'MANAGER') {
      projectFilter = `AND files.project_id IN (
                SELECT project_id FROM projects WHERE owner_manager_id = '${userId}'
            )`;
    }

    const { data: stats, error } = await supabase
      .rpc('get_file_statistics', { user_id: userId, user_role: req.user.role });

    if (error) {
      // Fallback to basic stats if function doesn't exist
      const { data: basicStats, error: basicError } = await supabase
        .from('files')
        .select('file_size, mime_type, project_id')
        .then(async ({ data, error }) => {
          if (error) throw error;

          const totalFiles = data.length;
          const totalSize = data.reduce((sum, file) => sum + (file.file_size || 0), 0);
          const avgSize = totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0;

          return {
            total_files: totalFiles,
            total_size_bytes: totalSize,
            average_file_size: avgSize,
            most_common_type: 'application/pdf' // Default
          };
        });

      if (basicError) throw basicError;

      return res.json({
        success: true,
        stats: basicStats
      });
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get file stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve file statistics' });
  }
};
