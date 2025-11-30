// src/models/estimate.model.js
const { supabase } = require('../config/supabase');

class TaskEstimate {
    /**
     * Create a new task estimate
     */
    static async create(estimateData) {
        const { data, error } = await supabase
            .from('task_estimates')
            .insert(estimateData)
            .select(`
                *,
                task:tasks(
                    task_id,
                    title,
                    project:projects(project_id, project_name)
                ),
                subtask:subtasks(
                    subtask_id,
                    title,
                    parent_task:tasks(
                        task_id,
                        title,
                        project:projects(project_id, project_name)
                    )
                ),
                estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, email, role)
            `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Find estimate by ID
     */
    static async findById(estimateId) {
        const { data, error } = await supabase
            .from('task_estimates')
            .select(`
                *,
                task:tasks(
                    task_id,
                    title,
                    project:projects(project_id, project_name)
                ),
                subtask:subtasks(
                    subtask_id,
                    title,
                    parent_task:tasks(
                        task_id,
                        title,
                        project:projects(project_id, project_name)
                    )
                ),
                estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, email, role)
            `)
            .eq('estimate_id', estimateId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get estimates for a specific task
     */
    static async findByTaskId(taskId) {
        const { data, error } = await supabase
            .from('task_estimates')
            .select(`
                *,
                estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, email, role)
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get estimates for a specific subtask
     */
    static async findBySubtaskId(subtaskId) {
        const { data, error } = await supabase
            .from('task_estimates')
            .select(`
                *,
                estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, email, role)
            `)
            .eq('subtask_id', subtaskId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get estimates by a specific user
     */
    static async findByEstimatorId(estimatorId, filters = {}) {
        let query = supabase
            .from('task_estimates')
            .select(`
                *,
                task:tasks(
                    task_id,
                    title,
                    project:projects(project_id, project_name)
                ),
                subtask:subtasks(
                    subtask_id,
                    title,
                    parent_task:tasks(
                        task_id,
                        title,
                        project:projects(project_id, project_name)
                    )
                )
            `)
            .eq('estimator_id', estimatorId);

        // Apply date range filters
        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        // Apply estimate type filter
        if (filters.estimateType) {
            query = query.eq('estimate_type', filters.estimateType);
        }

        // Apply project filter
        if (filters.projectId) {
            query = query.or(
                `task.project_id.eq.${filters.projectId},subtask.parent_task.project_id.eq.${filters.projectId}`
            );
        }

        const { data, error } = await query
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get estimates for a project
     */
    static async findByProjectId(projectId) {
        // Get estimates for tasks directly in the project
        const taskQuery = supabase
            .from('task_estimates')
            .select(`
                *,
                task:tasks!inner(
                    task_id,
                    title,
                    project_id
                ),
                subtask:subtasks(
                    subtask_id,
                    title,
                    parent_task:tasks!inner(
                        task_id,
                        title,
                        project_id
                    )
                ),
                estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, email, role)
            `)
            .not('task_id', 'is', null)
            .eq('task.project_id', projectId);

        // Get estimates for subtasks whose parent task is in the project
        const subtaskQuery = supabase
            .from('task_estimates')
            .select(`
                *,
                task:tasks!inner(
                    task_id,
                    title,
                    project_id
                ),
                subtask:subtasks(
                    subtask_id,
                    title,
                    parent_task:tasks!inner(
                        task_id,
                        title,
                        project_id
                    )
                ),
                estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, email, role)
            `)
            .not('subtask_id', 'is', null)
            .eq('subtask.parent_task.project_id', projectId);

        // Execute both queries
        const [taskResult, subtaskResult] = await Promise.all([
            taskQuery.order('created_at', { ascending: false }),
            subtaskQuery.order('created_at', { ascending: false })
        ]);

        if (taskResult.error) throw taskResult.error;
        if (subtaskResult.error) throw subtaskResult.error;

        // Combine and sort results
        const data = [...(taskResult.data || []), ...(subtaskResult.data || [])];
        return data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    /**
     * Update task/subtask with new estimate
     */
    static async updateTaskEstimate(taskId, subtaskId, estimatedHours, estimatorId, notes = null, estimateType = 'REVISED') {
        // Create estimate record
        const estimateData = {
            estimated_hours: estimatedHours,
            estimator_id: estimatorId,
            estimate_type: estimateType,
            notes: notes
        };

        if (taskId) {
            estimateData.task_id = taskId;
        } else if (subtaskId) {
            estimateData.subtask_id = subtaskId;
        } else {
            throw new Error('Either taskId or subtaskId must be provided');
        }

        const { data: estimate, error: estimateError } = await supabase
            .from('task_estimates')
            .insert(estimateData)
            .select()
            .single();

        if (estimateError) throw estimateError;

        // Update the task or subtask with the new estimate
        let updateResult;
        if (taskId) {
            const { data, error } = await supabase
                .from('tasks')
                .update({
                    estimated_hours: estimatedHours,
                    estimated_by: estimatorId,
                    estimated_at: new Date().toISOString()
                })
                .eq('task_id', taskId)
                .select()
                .single();

            if (error) throw error;
            updateResult = data;
        } else {
            const { data, error } = await supabase
                .from('subtasks')
                .update({
                    estimated_hours: estimatedHours,
                    estimated_by: estimatorId,
                    estimated_at: new Date().toISOString()
                })
                .eq('subtask_id', subtaskId)
                .select()
                .single();

            if (error) throw error;
            updateResult = data;
        }

        return { estimate, updated: updateResult };
    }

    /**
     * Get estimation accuracy stats for a user
     */
    static async getEstimationAccuracy(estimatorId, filters = {}) {
        let query = supabase
            .from('task_estimates')
            .select(`
                estimated_hours,
                actual_hours,
                estimate_type,
                task:tasks(task_id, status),
                subtask:subtasks(subtask_id, status)
            `)
            .eq('estimator_id', estimatorId);

        // Apply date range filters
        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        const stats = {
            totalEstimates: data.length,
            completedItems: 0,
            accuracyStats: {
                exact: 0,
                within10Percent: 0,
                within25Percent: 0,
                over25Percent: 0
            },
            averageAccuracy: 0,
            tendencies: {
                underestimate: 0,
                overestimate: 0,
                accurate: 0
            }
        };

        let totalAccuracy = 0;
        let completedCount = 0;

        data.forEach(estimate => {
            const estimatedHours = parseFloat(estimate.estimated_hours);
            let actualHours = parseFloat(estimate.actual_hours || 0);
            let isCompleted = false;

            // Get completion status
            if (estimate.task) {
                isCompleted = estimate.task.status === 'COMPLETED';
            } else if (estimate.subtask) {
                isCompleted = estimate.subtask.status === 'COMPLETED';
            }

            if (isCompleted && actualHours > 0) {
                completedCount++;
                stats.completedItems++;

                // Calculate accuracy percentage
                const accuracy = Math.abs(estimatedHours - actualHours) / estimatedHours;
                totalAccuracy += accuracy;

                // Categorize accuracy
                if (accuracy < 0.01) {
                    stats.accuracyStats.exact++;
                } else if (accuracy <= 0.10) {
                    stats.accuracyStats.within10Percent++;
                } else if (accuracy <= 0.25) {
                    stats.accuracyStats.within25Percent++;
                } else {
                    stats.accuracyStats.over25Percent++;
                }

                // Determine tendency
                if (estimatedHours < actualHours) {
                    stats.tendencies.underestimate++;
                } else if (estimatedHours > actualHours) {
                    stats.tendencies.overestimate++;
                } else {
                    stats.tendencies.accurate++;
                }
            }
        });

        // Calculate average accuracy
        if (completedCount > 0) {
            stats.averageAccuracy = (1 - (totalAccuracy / completedCount)) * 100;
        }

        return stats;
    }

    /**
     * Get estimation statistics for a project
     */
    static async getProjectEstimationStats(projectId) {
        // Get estimates for tasks directly in the project
        const taskQuery = supabase
            .from('task_estimates')
            .select(`
                estimated_hours,
                actual_hours,
                estimate_type,
                created_at,
                task:tasks(task_id, status, project_id),
                subtask:subtasks(
                    subtask_id, 
                    status,
                    parent_task:tasks(project_id)
                ),
                estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, role)
            `)
            .not('task_id', 'is', null)
            .eq('task.project_id', projectId);

        // Get estimates for subtasks whose parent task is in the project
        const subtaskQuery = supabase
            .from('task_estimates')
            .select(`
                estimated_hours,
                actual_hours,
                estimate_type,
                created_at,
                task:tasks(task_id, status, project_id),
                subtask:subtasks(
                    subtask_id, 
                    status,
                    parent_task:tasks(project_id)
                ),
                estimator:profiles!task_estimates_estimator_id_fkey(user_id, username, role)
            `)
            .not('subtask_id', 'is', null)
            .eq('subtask.parent_task.project_id', projectId);

        // Execute both queries
        const [taskResult, subtaskResult] = await Promise.all([
            taskQuery,
            subtaskQuery
        ]);

        if (taskResult.error) throw taskResult.error;
        if (subtaskResult.error) throw subtaskResult.error;

        // Combine results
        const data = [...(taskResult.data || []), ...(subtaskResult.data || [])];

        const stats = {
            totalEstimates: data.length,
            totalEstimatedHours: 0,
            totalActualHours: 0,
            estimatesByType: {
                INITIAL: 0,
                REVISED: 0,
                FINAL: 0
            },
            estimatorStats: {},
            monthlyEstimates: {}
        };

        data.forEach(estimate => {
            const estimatedHours = parseFloat(estimate.estimated_hours);
            stats.totalEstimatedHours += estimatedHours;

            // Count by type
            stats.estimatesByType[estimate.estimate_type]++;

            // Track estimator stats
            const estimatorId = estimate.estimator.user_id;
            if (!stats.estimatorStats[estimatorId]) {
                stats.estimatorStats[estimatorId] = {
                    name: estimate.estimator.username,
                    role: estimate.estimator.role,
                    count: 0,
                    totalHours: 0
                };
            }
            stats.estimatorStats[estimatorId].count++;
            stats.estimatorStats[estimatorId].totalHours += estimatedHours;

            // Track monthly estimates
            const month = estimate.created_at.substring(0, 7); // YYYY-MM
            stats.monthlyEstimates[month] = (stats.monthlyEstimates[month] || 0) + 1;

            // Add actual hours if available
            if (estimate.actual_hours) {
                stats.totalActualHours += parseFloat(estimate.actual_hours);
            }
        });

        return stats;
    }

    /**
     * Get task estimation summary (average, min, max estimates)
     */
    static async getTaskEstimationSummary(taskId) {
        const { data, error } = await supabase
            .from('task_estimates')
            .select('estimated_hours, actual_hours')
            .eq('task_id', taskId);

        if (error) throw error;

        if (data.length === 0) {
            return {
                estimateCount: 0,
                averageEstimate: 0,
                minEstimate: 0,
                maxEstimate: 0,
                actualHours: null
            };
        }

        const estimates = data.map(d => d.estimated_hours);
        const actualHours = data.find(d => d.actual_hours !== null)?.actual_hours || null;

        return {
            estimateCount: estimates.length,
            averageEstimate: estimates.reduce((sum, est) => sum + est, 0) / estimates.length,
            minEstimate: Math.min(...estimates),
            maxEstimate: Math.max(...estimates),
            actualHours
        };
    }

    /**
     * Get subtask estimation summary
     */
    static async getSubtaskEstimationSummary(subtaskId) {
        const { data, error } = await supabase
            .from('task_estimates')
            .select('estimated_hours, actual_hours')
            .eq('subtask_id', subtaskId);

        if (error) throw error;

        if (data.length === 0) {
            return {
                estimateCount: 0,
                averageEstimate: 0,
                minEstimate: 0,
                maxEstimate: 0,
                actualHours: null
            };
        }

        const estimates = data.map(d => d.estimated_hours);
        const actualHours = data.find(d => d.actual_hours !== null)?.actual_hours || null;

        return {
            estimateCount: estimates.length,
            averageEstimate: estimates.reduce((sum, est) => sum + est, 0) / estimates.length,
            minEstimate: Math.min(...estimates),
            maxEstimate: Math.max(...estimates),
            actualHours
        };
    }

    /**
     * Get estimation trends for analytics
     */
    static async getEstimationTrends(filters = {}) {
        let query = supabase
            .from('task_estimates')
            .select(`
                *,
                task:tasks(project_id, title),
                subtask:subtasks(title),
                estimator:profiles!task_estimates_estimator_id_fkey(username)
            `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.projectId) {
            query = query.eq('task.project_id', filters.projectId);
        }
        if (filters.estimatorId) {
            query = query.eq('estimator_id', filters.estimatorId);
        }
        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;
        return data;
    }

    /**
     * Update an estimate
     */
    static async update(estimateId, updateData) {
        const { data, error } = await supabase
            .from('task_estimates')
            .update(updateData)
            .eq('estimate_id', estimateId)
            .select(`
                *,
                task:tasks(
                    task_id,
                    title,
                    project:projects(project_id, project_name)
                ),
                subtask:subtasks(
                    subtask_id,
                    title,
                    parent_task:tasks(
                        task_id,
                        title,
                        project:projects(project_id, project_name)
                    )
                ),
                estimator:profiles(user_id, username, role)
            `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete an estimate
     */
    static async delete(estimateId) {
        const { error } = await supabase
            .from('task_estimates')
            .delete()
            .eq('estimate_id', estimateId);

        if (error) throw error;
        return true;
    }

    /**
     * Update subtask estimate (convenience method)
     */
    static async updateSubtaskEstimate(subtaskId, estimatedHours, estimatorId, notes = null, estimateType = 'REVISED') {
        return this.updateTaskEstimate(null, subtaskId, estimatedHours, estimatorId, notes, estimateType);
    }

    /**
     * Update actual hours for task estimates
     */
    static async updateTaskActualHours(taskId, actualHours) {
        const { data, error } = await supabase
            .from('task_estimates')
            .update({ actual_hours: actualHours })
            .eq('task_id', taskId)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Update actual hours for subtask estimates
     */
    static async updateSubtaskActualHours(subtaskId, actualHours) {
        const { data, error } = await supabase
            .from('task_estimates')
            .update({ actual_hours: actualHours })
            .eq('subtask_id', subtaskId)
            .select();

        if (error) throw error;
        return data;
    }
}

module.exports = TaskEstimate;