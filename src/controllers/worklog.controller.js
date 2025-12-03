// src/controllers/worklog.controller.js
const WorkLog = require('../models/worklog.model');
const { body, param, query, validationResult } = require('express-validator');

class WorkLogController {
    /**
     * Create a new work log entry
     */
    static async createWorkLog(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const workLogData = {
                ...req.body,
                user_id: req.user.user_id
            };

            const workLog = await WorkLog.create(workLogData);

            res.status(201).json({
                success: true,
                message: 'Work log created successfully',
                workLog
            });
        } catch (error) {
            console.error('Create work log error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create work log',
                error: error.message
            });
        }
    }

    /**
     * Get work log by ID
     */
    static async getWorkLog(req, res) {
        try {
            const { logId } = req.params;
            const workLog = await WorkLog.findById(logId);

            if (!workLog) {
                return res.status(404).json({
                    success: false,
                    message: 'Work log not found'
                });
            }

            res.json({
                success: true,
                workLog
            });
        } catch (error) {
            console.error('Get work log error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch work log',
                error: error.message
            });
        }
    }

    /**
     * Get work logs for current user
     */
    static async getUserWorkLogs(req, res) {
        try {
            const userId = req.user.user_id;
            const { startDate, endDate, projectId, taskId, logType, page = 1, limit = 50 } = req.query;

            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            if (projectId) filters.projectId = projectId;
            if (taskId) filters.taskId = taskId;
            if (logType) filters.logType = logType;

            const workLogs = await WorkLog.findByUserId(userId, filters);

            // Simple pagination
            const offset = (page - 1) * limit;
            const paginatedLogs = workLogs.slice(offset, offset + parseInt(limit));

            res.json({
                success: true,
                workLogs: paginatedLogs,
                pagination: {
                    currentPage: parseInt(page),
                    totalItems: workLogs.length,
                    totalPages: Math.ceil(workLogs.length / limit),
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get user work logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user work logs',
                error: error.message
            });
        }
    }

    /**
     * Get work logs for a specific task
     */
    static async getTaskWorkLogs(req, res) {
        try {
            const { taskId } = req.params;
            const workLogs = await WorkLog.findByTaskId(taskId);

            res.json({
                success: true,
                workLogs,
                count: workLogs.length
            });
        } catch (error) {
            console.error('Get task work logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task work logs',
                error: error.message
            });
        }
    }

    /**
     * Get work logs for a specific subtask
     */
    static async getSubtaskWorkLogs(req, res) {
        try {
            const { subtaskId } = req.params;
            const workLogs = await WorkLog.findBySubtaskId(subtaskId);

            res.json({
                success: true,
                workLogs,
                count: workLogs.length
            });
        } catch (error) {
            console.error('Get subtask work logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch subtask work logs',
                error: error.message
            });
        }
    }

    /**
     * Get work logs for a project (managers/admins only)
     */
    static async getProjectWorkLogs(req, res) {
        try {
            const { projectId } = req.params;
            const { startDate, endDate, userId, logType, page = 1, limit = 100 } = req.query;

            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            if (userId) filters.userId = userId;
            if (logType) filters.logType = logType;

            const workLogs = await WorkLog.findByProjectId(projectId, filters);

            // Simple pagination
            const offset = (page - 1) * limit;
            const paginatedLogs = workLogs.slice(offset, offset + parseInt(limit));

            res.json({
                success: true,
                workLogs: paginatedLogs,
                pagination: {
                    currentPage: parseInt(page),
                    totalItems: workLogs.length,
                    totalPages: Math.ceil(workLogs.length / limit),
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get project work logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project work logs',
                error: error.message
            });
        }
    }

    /**
     * Update work log
     */
    static async updateWorkLog(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { logId } = req.params;
            const updateData = req.body;

            const workLog = await WorkLog.update(logId, updateData);

            res.json({
                success: true,
                message: 'Work log updated successfully',
                workLog
            });
        } catch (error) {
            console.error('Update work log error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update work log',
                error: error.message
            });
        }
    }

    /**
     * Delete work log
     */
    static async deleteWorkLog(req, res) {
        try {
            const { logId } = req.params;
            await WorkLog.delete(logId);

            res.json({
                success: true,
                message: 'Work log deleted successfully'
            });
        } catch (error) {
            console.error('Delete work log error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete work log',
                error: error.message
            });
        }
    }

    /**
     * Get work log statistics for current user
     */
    static async getUserStats(req, res) {
        try {
            const userId = req.user.user_id;
            const { startDate, endDate } = req.query;

            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            const stats = await WorkLog.getUserStats(userId, filters);

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get user work log stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user work log statistics',
                error: error.message
            });
        }
    }

    /**
     * Get work log statistics for a project (managers/admins only)
     */
    static async getProjectStats(req, res) {
        try {
            const { projectId } = req.params;
            const { startDate, endDate } = req.query;

            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            const stats = await WorkLog.getProjectStats(projectId, filters);

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get project work log stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project work log statistics',
                error: error.message
            });
        }
    }

    /**
     * Get recent work logs for dashboard
     */
    static async getRecentWorkLogs(req, res) {
        try {
            const { limit = 10, userId } = req.query;

            // If user requests specific user and has permission, or gets own logs
            const requestUserId = userId && (req.user.role === 'ADMIN' || req.user.role === 'MANAGER')
                ? userId
                : req.user.user_id;

            const workLogs = await WorkLog.getRecentLogs(requestUserId, parseInt(limit));

            res.json({
                success: true,
                workLogs,
                count: workLogs.length
            });
        } catch (error) {
            console.error('Get recent work logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch recent work logs',
                error: error.message
            });
        }
    }

    /**
     * Bulk create work logs
     */
    static async createBulkWorkLogs(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { workLogs } = req.body;

            // Add user_id to each work log
            const workLogsWithUser = workLogs.map(log => ({
                ...log,
                user_id: req.user.user_id
            }));

            const createdWorkLogs = await WorkLog.createBulk(workLogsWithUser);

            res.status(201).json({
                success: true,
                message: `${createdWorkLogs.length} work logs created successfully`,
                workLogs: createdWorkLogs
            });
        } catch (error) {
            console.error('Create bulk work logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create bulk work logs',
                error: error.message
            });
        }
    }
}

// Validation rules
WorkLogController.validationRules = {
    createWorkLog: [
        body('hours_logged')
            .isFloat({ min: 0.1, max: 24 })
            .withMessage('Hours logged must be between 0.1 and 24'),
        body('work_date')
            .isDate()
            .withMessage('Work date must be a valid date'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
        body('log_type')
            .optional()
            .isIn(['DEVELOPMENT', 'TESTING', 'REVIEW', 'DOCUMENTATION', 'MEETING', 'RESEARCH', 'BUG_FIX', 'OTHER'])
            .withMessage('Log type must be a valid type'),
        body('task_id')
            .optional({ nullable: true, checkFalsy: true })
            .isUUID()
            .withMessage('Task ID must be a valid UUID'),
        body('subtask_id')
            .optional({ nullable: true, checkFalsy: true })
            .isUUID()
            .withMessage('Subtask ID must be a valid UUID')
    ],

    updateWorkLog: [
        body('hours_logged')
            .optional()
            .isFloat({ min: 0.1, max: 24 })
            .withMessage('Hours logged must be between 0.1 and 24'),
        body('work_date')
            .optional()
            .isDate()
            .withMessage('Work date must be a valid date'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
        body('log_type')
            .optional()
            .isIn(['DEVELOPMENT', 'TESTING', 'REVIEW', 'DOCUMENTATION', 'MEETING', 'RESEARCH', 'BUG_FIX', 'OTHER'])
            .withMessage('Log type must be a valid type')
    ],

    createBulkWorkLogs: [
        body('workLogs')
            .isArray({ min: 1, max: 50 })
            .withMessage('Work logs must be an array with 1-50 items'),
        body('workLogs.*.hours_logged')
            .isFloat({ min: 0.1, max: 24 })
            .withMessage('Hours logged must be between 0.1 and 24'),
        body('workLogs.*.work_date')
            .isDate()
            .withMessage('Work date must be a valid date'),
        body('workLogs.*.task_id')
            .optional({ nullable: true, checkFalsy: true })
            .isUUID()
            .withMessage('Task ID must be a valid UUID'),
        body('workLogs.*.subtask_id')
            .optional({ nullable: true, checkFalsy: true })
            .isUUID()
            .withMessage('Subtask ID must be a valid UUID')
    ]
};

module.exports = WorkLogController;