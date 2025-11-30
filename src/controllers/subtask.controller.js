// src/controllers/subtask.controller.js
const Subtask = require('../models/subtask.model');
const { body, param, query, validationResult } = require('express-validator');

class SubtaskController {
    /**
     * Create a new subtask
     */
    static async createSubtask(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const subtaskData = {
                ...req.body,
                created_by: req.user.user_id // Add the authenticated user ID
            };

            const subtask = await Subtask.create(subtaskData);

            res.status(201).json({
                success: true,
                message: 'Subtask created successfully',
                subtask
            });
        } catch (error) {
            console.error('Create subtask error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create subtask',
                error: error.message
            });
        }
    }

    /**
     * Get subtask by ID
     */
    static async getSubtask(req, res) {
        try {
            const { subtaskId } = req.params;
            const subtask = await Subtask.findById(subtaskId);

            if (!subtask) {
                return res.status(404).json({
                    success: false,
                    message: 'Subtask not found'
                });
            }

            res.json({
                success: true,
                subtask
            });
        } catch (error) {
            console.error('Get subtask error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch subtask',
                error: error.message
            });
        }
    }

    /**
     * Get subtasks for a specific task
     */
    static async getTaskSubtasks(req, res) {
        try {
            const { taskId } = req.params;
            const subtasks = await Subtask.findByTaskId(taskId);

            res.json({
                success: true,
                subtasks,
                count: subtasks.length
            });
        } catch (error) {
            console.error('Get task subtasks error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task subtasks',
                error: error.message
            });
        }
    }

    /**
     * Get user's assigned subtasks
     */
    static async getUserSubtasks(req, res) {
        try {
            const userId = req.user.user_id;
            const { status, projectId } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (projectId) filters.projectId = projectId;

            const subtasks = await Subtask.findByUserId(userId, filters);

            res.json({
                success: true,
                subtasks,
                count: subtasks.length
            });
        } catch (error) {
            console.error('Get user subtasks error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user subtasks',
                error: error.message
            });
        }
    }

    /**
     * Get subtasks for a project
     */
    static async getProjectSubtasks(req, res) {
        try {
            const { projectId } = req.params;
            const subtasks = await Subtask.findByProjectId(projectId);

            res.json({
                success: true,
                subtasks,
                count: subtasks.length
            });
        } catch (error) {
            console.error('Get project subtasks error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project subtasks',
                error: error.message
            });
        }
    }

    /**
     * Update subtask
     */
    static async updateSubtask(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { subtaskId } = req.params;
            const updateData = req.body;

            const subtask = await Subtask.update(subtaskId, updateData);

            res.json({
                success: true,
                message: 'Subtask updated successfully',
                subtask
            });
        } catch (error) {
            console.error('Update subtask error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update subtask',
                error: error.message
            });
        }
    }

    /**
     * Delete subtask
     */
    static async deleteSubtask(req, res) {
        try {
            const { subtaskId } = req.params;
            await Subtask.delete(subtaskId);

            res.json({
                success: true,
                message: 'Subtask deleted successfully'
            });
        } catch (error) {
            console.error('Delete subtask error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete subtask',
                error: error.message
            });
        }
    }

    /**
     * Assign user to subtask
     */
    static async assignUser(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { subtaskId } = req.params;
            const { assigneeId } = req.body;
            const assignedBy = req.user.user_id;

            const assignment = await Subtask.assignUser(subtaskId, assigneeId, assignedBy);

            res.status(201).json({
                success: true,
                message: 'User assigned to subtask successfully',
                assignment
            });
        } catch (error) {
            console.error('Assign user to subtask error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to assign user to subtask',
                error: error.message
            });
        }
    }

    /**
     * Remove user assignment from subtask
     */
    static async unassignUser(req, res) {
        try {
            const { subtaskId, assigneeId } = req.params;
            await Subtask.unassignUser(subtaskId, assigneeId);

            res.json({
                success: true,
                message: 'User unassigned from subtask successfully'
            });
        } catch (error) {
            console.error('Unassign user from subtask error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unassign user from subtask',
                error: error.message
            });
        }
    }

    /**
     * Add estimate to subtask
     */
    static async addEstimate(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { subtaskId } = req.params;
            const { estimatedHours, notes, estimateType } = req.body;
            const estimatorId = req.user.user_id;

            const result = await Subtask.addEstimate(
                subtaskId,
                estimatedHours,
                estimatorId,
                notes,
                estimateType || 'INITIAL'
            );

            res.status(201).json({
                success: true,
                message: 'Estimate added successfully',
                estimate: result.estimate,
                subtask: result.subtask
            });
        } catch (error) {
            console.error('Add subtask estimate error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add estimate',
                error: error.message
            });
        }
    }

    /**
     * Get subtask statistics
     */
    static async getSubtaskStats(req, res) {
        try {
            const { subtaskId } = req.params;
            const stats = await Subtask.getStats(subtaskId);

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get subtask stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch subtask statistics',
                error: error.message
            });
        }
    }
}

// Validation rules
SubtaskController.validationRules = {
    createSubtask: [
        body('parent_task_id')
            .isUUID()
            .withMessage('Parent task ID must be a valid UUID'),
        body('title')
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Title must be between 1 and 255 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
        body('status')
            .optional()
            .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
            .withMessage('Status must be PENDING, IN_PROGRESS, COMPLETED, or CANCELLED'),
        body('priority')
            .optional()
            .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
            .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
        body('estimated_hours')
            .optional()
            .isFloat({ min: 0.1, max: 999.99 })
            .withMessage('Estimated hours must be between 0.1 and 999.99'),
        body('start_date')
            .optional()
            .isISO8601()
            .withMessage('Start date must be a valid date'),
        body('end_date')
            .optional()
            .isISO8601()
            .withMessage('End date must be a valid date')
    ],

    updateSubtask: [
        body('title')
            .optional()
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Title must be between 1 and 255 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
        body('status')
            .optional()
            .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
            .withMessage('Status must be PENDING, IN_PROGRESS, COMPLETED, or CANCELLED'),
        body('priority')
            .optional()
            .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
            .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
        body('estimated_hours')
            .optional()
            .isFloat({ min: 0.1, max: 999.99 })
            .withMessage('Estimated hours must be between 0.1 and 999.99'),
        body('start_date')
            .optional()
            .isISO8601()
            .withMessage('Start date must be a valid date'),
        body('end_date')
            .optional()
            .isISO8601()
            .withMessage('End date must be a valid date')
    ],

    assignUser: [
        body('assigneeId')
            .isUUID()
            .withMessage('Assignee ID must be a valid UUID')
    ],

    addEstimate: [
        body('estimatedHours')
            .isFloat({ min: 0.1, max: 999.99 })
            .withMessage('Estimated hours must be between 0.1 and 999.99'),
        body('notes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Notes must not exceed 500 characters'),
        body('estimateType')
            .optional()
            .isIn(['INITIAL', 'REVISED', 'FINAL'])
            .withMessage('Estimate type must be INITIAL, REVISED, or FINAL')
    ]
};

module.exports = SubtaskController;