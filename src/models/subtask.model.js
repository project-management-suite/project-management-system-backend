// src/models/subtask.model.js
const { supabase } = require('../config/supabase');

class Subtask {
    /**
     * Create a new subtask
     */
    static async create(subtaskData) {
        const { data, error } = await supabase
            .from('subtasks')
            .insert(subtaskData)
            .select(`
                *,
                parent_task:tasks(task_id, title, project_id),
                creator:profiles!subtasks_created_by_fkey(user_id, username, email),
                estimator:profiles!subtasks_estimated_by_fkey(user_id, username, email)
            `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Find subtask by ID
     */
    static async findById(subtaskId) {
        const { data, error } = await supabase
            .from('subtasks')
            .select(`
                *,
                parent_task:tasks(
                    task_id,
                    title,
                    project_id,
                    project:projects(project_id, project_name)
                ),
                creator:profiles!subtasks_created_by_fkey(user_id, username, email),
                estimator:profiles!subtasks_estimated_by_fkey(user_id, username, email),
                assignments:subtask_assignments(
                    assignment_id,
                    assigned_at,
                    assignee:profiles!subtask_assignments_assignee_id_fkey(user_id, username, email),
                    assigner:profiles!subtask_assignments_assigned_by_fkey(user_id, username, email)
                ),
                work_logs(
                    log_id,
                    hours_logged,
                    work_date,
                    description,
                    log_type,
                    created_at,
                    logger:profiles!work_logs_user_id_fkey(user_id, username, email)
                )
            `)
            .eq('subtask_id', subtaskId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get all subtasks for a parent task
     */
    static async findByTaskId(taskId) {
        const { data, error } = await supabase
            .from('subtasks')
            .select(`
                *,
                creator:profiles!subtasks_created_by_fkey(user_id, username, email),
                estimator:profiles!subtasks_estimated_by_fkey(user_id, username, email),
                assignments:subtask_assignments(
                    assignment_id,
                    assignee:profiles!subtask_assignments_assignee_id_fkey(user_id, username, email)
                )
            `)
            .eq('parent_task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Get subtasks assigned to a user
     */
    static async findByUserId(userId, filters = {}) {
        let query = supabase
            .from('subtask_assignments')
            .select(`
                assignment_id,
                assigned_at,
                subtask:subtasks(
                    *,
                    parent_task:tasks(
                        task_id,
                        title,
                        project:projects(project_id, project_name)
                    ),
                    creator:profiles!subtasks_created_by_fkey(user_id, username, email)
                )
            `)
            .eq('assignee_id', userId);

        // Apply status filter if provided
        if (filters.status) {
            query = query.eq('subtask.status', filters.status);
        }

        // Apply project filter if provided
        if (filters.projectId) {
            query = query.eq('subtask.parent_task.project_id', filters.projectId);
        }

        const { data, error } = await query
            .order('assigned_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Update subtask
     */
    static async update(subtaskId, updateData) {
        const { data, error } = await supabase
            .from('subtasks')
            .update(updateData)
            .eq('subtask_id', subtaskId)
            .select(`
                *,
                parent_task:tasks(task_id, title),
                creator:profiles!subtasks_created_by_fkey(user_id, username, email)
            `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete subtask
     */
    static async delete(subtaskId) {
        const { data, error } = await supabase
            .from('subtasks')
            .delete()
            .eq('subtask_id', subtaskId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Assign user to subtask
     */
    static async assignUser(subtaskId, assigneeId, assignedBy) {
        const { data, error } = await supabase
            .from('subtask_assignments')
            .insert({
                subtask_id: subtaskId,
                assignee_id: assigneeId,
                assigned_by: assignedBy
            })
            .select(`
                *,
                subtask:subtasks(subtask_id, title),
                assignee:profiles!subtask_assignments_assignee_id_fkey(user_id, username, email),
                assigner:profiles!subtask_assignments_assigned_by_fkey(user_id, username, email)
            `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Remove user assignment from subtask
     */
    static async unassignUser(subtaskId, assigneeId) {
        const { data, error } = await supabase
            .from('subtask_assignments')
            .delete()
            .eq('subtask_id', subtaskId)
            .eq('assignee_id', assigneeId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Add estimate to subtask
     */
    static async addEstimate(subtaskId, estimatedHours, estimatorId, notes = null, estimateType = 'INITIAL') {
        // Start transaction
        const { data: estimate, error: estimateError } = await supabase
            .from('task_estimates')
            .insert({
                subtask_id: subtaskId,
                estimated_hours: estimatedHours,
                estimator_id: estimatorId,
                estimate_type: estimateType,
                notes: notes
            })
            .select()
            .single();

        if (estimateError) throw estimateError;

        // Update subtask with latest estimate
        const { data: subtask, error: updateError } = await supabase
            .from('subtasks')
            .update({
                estimated_hours: estimatedHours,
                estimated_by: estimatorId,
                estimated_at: new Date().toISOString()
            })
            .eq('subtask_id', subtaskId)
            .select()
            .single();

        if (updateError) throw updateError;

        return { estimate, subtask };
    }

    /**
     * Get subtask statistics
     */
    static async getStats(subtaskId) {
        const { data, error } = await supabase
            .from('subtasks')
            .select(`
                *,
                work_logs(hours_logged, log_type),
                assignments:subtask_assignments(assignee_id)
            `)
            .eq('subtask_id', subtaskId)
            .single();

        if (error) throw error;

        const stats = {
            subtaskId,
            title: data.title,
            status: data.status,
            estimatedHours: data.estimated_hours || 0,
            actualHours: data.actual_hours || 0,
            remainingHours: Math.max((data.estimated_hours || 0) - (data.actual_hours || 0), 0),
            progressPercentage: data.estimated_hours ? Math.round((data.actual_hours / data.estimated_hours) * 100) : 0,
            assigneesCount: data.assignments.length,
            workLogsByType: data.work_logs.reduce((acc, log) => {
                acc[log.log_type] = (acc[log.log_type] || 0) + parseFloat(log.hours_logged);
                return acc;
            }, {})
        };

        return stats;
    }

    /**
     * Get subtasks by project with statistics
     */
    static async findByProjectId(projectId) {
        const { data, error } = await supabase
            .from('subtasks')
            .select(`
                *,
                parent_task:tasks!inner(
                    task_id,
                    title,
                    project_id
                ),
                creator:profiles!subtasks_created_by_fkey(user_id, username, email),
                assignments:subtask_assignments(
                    assignee:profiles!subtask_assignments_assignee_id_fkey(user_id, username, email)
                )
            `)
            .eq('parent_task.project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
}

module.exports = Subtask;