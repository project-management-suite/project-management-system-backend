// src/controllers/estimate.controller.js
const TaskEstimate = require('../models/estimate.model');
const { body, param, query, validationResult } = require('express-validator');

class EstimateController {
    /**
     * Create a new task estimate
     */
    static async createEstimate(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const estimateData = {
                ...req.body,
                estimator_id: req.user.user_id
            };

            const estimate = await TaskEstimate.create(estimateData);

            // If this is a task estimate (not subtask), update the task's estimated_hours
            if (estimate.task_id && !estimate.subtask_id) {
                const { supabase } = require('../config/supabase');
                const { data: updatedTask, error: updateError } = await supabase
                    .from('tasks')
                    .update({
                        estimated_hours: estimateData.estimated_hours,
                        estimated_by: req.user.user_id,
                        estimated_at: new Date().toISOString()
                    })
                    .eq('task_id', estimate.task_id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Error updating task estimate:', updateError);
                } else {
                    console.log('Task updated with estimate:', updatedTask);
                }
            }

            // If this is a subtask estimate, update the subtask's estimated_hours
            if (estimate.subtask_id) {
                const { supabase } = require('../config/supabase');
                const { data: updatedSubtask, error: updateError } = await supabase
                    .from('subtasks')
                    .update({
                        estimated_hours: estimateData.estimated_hours
                    })
                    .eq('subtask_id', estimate.subtask_id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Error updating subtask estimate:', updateError);
                } else {
                    console.log('Subtask updated with estimate:', updatedSubtask);
                }
            }

            res.status(201).json({
                success: true,
                message: 'Estimate created successfully',
                estimate
            });
        } catch (error) {
            console.error('Create estimate error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create estimate',
                error: error.message
            });
        }
    }

    /**
     * Get estimate by ID
     */
    static async getEstimate(req, res) {
        try {
            const { estimateId } = req.params;
            const estimate = await TaskEstimate.findById(estimateId);

            if (!estimate) {
                return res.status(404).json({
                    success: false,
                    message: 'Estimate not found'
                });
            }

            res.json({
                success: true,
                estimate
            });
        } catch (error) {
            console.error('Get estimate error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch estimate',
                error: error.message
            });
        }
    }

    /**
     * Get estimates for a task
     */
    static async getTaskEstimates(req, res) {
        try {
            const { taskId } = req.params;
            const estimates = await TaskEstimate.findByTaskId(taskId);

            res.json({
                success: true,
                estimates,
                count: estimates.length
            });
        } catch (error) {
            console.error('Get task estimates error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task estimates',
                error: error.message
            });
        }
    }

    /**
     * Get estimates for a subtask
     */
    static async getSubtaskEstimates(req, res) {
        try {
            const { subtaskId } = req.params;
            const estimates = await TaskEstimate.findBySubtaskId(subtaskId);

            res.json({
                success: true,
                estimates,
                count: estimates.length
            });
        } catch (error) {
            console.error('Get subtask estimates error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch subtask estimates',
                error: error.message
            });
        }
    }

    /**
     * Get estimates by estimator (current user or specific user if admin/manager)
     */
    static async getEstimatorEstimates(req, res) {
        try {
            const { estimatorId } = req.params;

            // Check if user can access other user's estimates
            if (estimatorId !== req.user.user_id &&
                req.user.role !== 'ADMIN' &&
                req.user.role !== 'MANAGER') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const estimates = await TaskEstimate.findByEstimatorId(estimatorId);

            res.json({
                success: true,
                estimates,
                count: estimates.length
            });
        } catch (error) {
            console.error('Get estimator estimates error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch estimator estimates',
                error: error.message
            });
        }
    }

    /**
     * Get current user's estimates
     */
    static async getMyEstimates(req, res) {
        try {
            const userId = req.user.user_id;
            const estimates = await TaskEstimate.findByEstimatorId(userId);

            res.json({
                success: true,
                estimates,
                count: estimates.length
            });
        } catch (error) {
            console.error('Get my estimates error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch your estimates',
                error: error.message
            });
        }
    }

    /**
     * Update estimate
     */
    static async updateEstimate(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { estimateId } = req.params;
            const updateData = req.body;

            const estimate = await TaskEstimate.update(estimateId, updateData);

            res.json({
                success: true,
                message: 'Estimate updated successfully',
                estimate
            });
        } catch (error) {
            console.error('Update estimate error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update estimate',
                error: error.message
            });
        }
    }

    /**
     * Delete estimate
     */
    static async deleteEstimate(req, res) {
        try {
            const { estimateId } = req.params;
            await TaskEstimate.delete(estimateId);

            res.json({
                success: true,
                message: 'Estimate deleted successfully'
            });
        } catch (error) {
            console.error('Delete estimate error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete estimate',
                error: error.message
            });
        }
    }

    /**
     * Update task estimate with actual hours (when task is completed)
     */
    static async updateTaskEstimate(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { taskId } = req.params;
            const { actualHours } = req.body;

            const result = await TaskEstimate.updateTaskActualHours(taskId, actualHours);

            res.json({
                success: true,
                message: 'Task estimates updated with actual hours',
                result
            });
        } catch (error) {
            console.error('Update task estimate error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update task estimate',
                error: error.message
            });
        }
    }

    /**
     * Update subtask estimate with actual hours
     */
    static async updateSubtaskEstimate(req, res) {
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
            const { actualHours } = req.body;

            const result = await TaskEstimate.updateSubtaskActualHours(subtaskId, actualHours);

            res.json({
                success: true,
                message: 'Subtask estimates updated with actual hours',
                result
            });
        } catch (error) {
            console.error('Update subtask estimate error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update subtask estimate',
                error: error.message
            });
        }
    }

    /**
     * Get estimation accuracy for an estimator
     */
    static async getEstimationAccuracy(req, res) {
        try {
            const { estimatorId } = req.params;

            // Check permissions
            if (estimatorId !== req.user.user_id &&
                req.user.role !== 'ADMIN' &&
                req.user.role !== 'MANAGER') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const accuracy = await TaskEstimate.getEstimationAccuracy(estimatorId);

            res.json({
                success: true,
                accuracy
            });
        } catch (error) {
            console.error('Get estimation accuracy error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch estimation accuracy',
                error: error.message
            });
        }
    }

    /**
     * Get current user's estimation accuracy
     */
    static async getMyEstimationAccuracy(req, res) {
        try {
            const userId = req.user.user_id;
            const accuracy = await TaskEstimate.getEstimationAccuracy(userId);

            res.json({
                success: true,
                accuracy
            });
        } catch (error) {
            console.error('Get my estimation accuracy error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch your estimation accuracy',
                error: error.message
            });
        }
    }

    /**
     * Get project estimation statistics
     */
    static async getProjectEstimationStats(req, res) {
        try {
            const { projectId } = req.params;
            const stats = await TaskEstimate.getProjectEstimationStats(projectId);

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get project estimation stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project estimation statistics',
                error: error.message
            });
        }
    }

    /**
     * Get task estimation summary (average, min, max estimates)
     */
    static async getTaskEstimationSummary(req, res) {
        try {
            const { taskId } = req.params;
            const summary = await TaskEstimate.getTaskEstimationSummary(taskId);

            res.json({
                success: true,
                summary
            });
        } catch (error) {
            console.error('Get task estimation summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch task estimation summary',
                error: error.message
            });
        }
    }

    /**
     * Get subtask estimation summary
     */
    static async getSubtaskEstimationSummary(req, res) {
        try {
            const { subtaskId } = req.params;
            const summary = await TaskEstimate.getSubtaskEstimationSummary(subtaskId);

            res.json({
                success: true,
                summary
            });
        } catch (error) {
            console.error('Get subtask estimation summary error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch subtask estimation summary',
                error: error.message
            });
        }
    }

    /**
     * Get estimation trends (for analytics)
     */
    static async getEstimationTrends(req, res) {
        try {
            const { projectId, estimatorId, startDate, endDate } = req.query;

            // Build filters
            const filters = {};
            if (projectId) filters.projectId = projectId;
            if (estimatorId) filters.estimatorId = estimatorId;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            const trends = await TaskEstimate.getEstimationTrends(filters);

            res.json({
                success: true,
                trends
            });
        } catch (error) {
            console.error('Get estimation trends error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch estimation trends',
                error: error.message
            });
        }
    }
}

// Validation rules
EstimateController.validationRules = {
    createEstimate: [
        body('estimated_hours')
            .isFloat({ min: 0.1, max: 1000 })
            .withMessage('Estimated hours must be between 0.1 and 1000'),
        body('complexity')
            .optional()
            .isIn(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'])
            .withMessage('Complexity must be LOW, MEDIUM, HIGH, or VERY_HIGH'),
        body('confidence_level')
            .optional()
            .isInt({ min: 1, max: 5 })
            .withMessage('Confidence level must be between 1 and 5'),
        body('notes')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Notes must not exceed 1000 characters'),
        body('task_id')
            .optional({ nullable: true, checkFalsy: true })
            .isUUID()
            .withMessage('Task ID must be a valid UUID'),
        body('subtask_id')
            .optional({ nullable: true, checkFalsy: true })
            .isUUID()
            .withMessage('Subtask ID must be a valid UUID'),
        // Custom validation: either task_id or subtask_id must be provided
        body().custom((value) => {
            if (!value.task_id && !value.subtask_id) {
                throw new Error('Either task_id or subtask_id must be provided');
            }
            if (value.task_id && value.subtask_id) {
                throw new Error('Cannot provide both task_id and subtask_id');
            }
            return true;
        })
    ],

    updateEstimate: [
        body('estimated_hours')
            .optional()
            .isFloat({ min: 0.1, max: 1000 })
            .withMessage('Estimated hours must be between 0.1 and 1000'),
        body('complexity')
            .optional()
            .isIn(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'])
            .withMessage('Complexity must be LOW, MEDIUM, HIGH, or VERY_HIGH'),
        body('confidence_level')
            .optional()
            .isInt({ min: 1, max: 5 })
            .withMessage('Confidence level must be between 1 and 5'),
        body('notes')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Notes must not exceed 1000 characters')
    ],

    updateTaskEstimate: [
        body('actualHours')
            .isFloat({ min: 0 })
            .withMessage('Actual hours must be a positive number')
    ],

    updateSubtaskEstimate: [
        body('actualHours')
            .isFloat({ min: 0 })
            .withMessage('Actual hours must be a positive number')
    ]
};

module.exports = EstimateController;