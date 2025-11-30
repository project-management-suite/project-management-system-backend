// src/models/worklog.model.js
const { supabase } = require('../config/supabase');

class WorkLog {
    /**
     * Create a new work log entry
     */
    static async create(workLogData) {
        const { data, error } = await supabase
            .from('work_logs')
            .insert(workLogData)
            .select(`
                *,
                task:tasks(task_id, title, project:projects(project_id, project_name)),
                subtask:subtasks(subtask_id, title, parent_task:tasks(task_id, title)),
                user:profiles!work_logs_user_id_fkey(user_id, username, email, role)
            `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Find work log by ID
     */
    static async findById(logId) {
        const { data, error } = await supabase
            .from('work_logs')
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
                user:profiles!work_logs_user_id_fkey(user_id, username, email, role)
            `)
            .eq('log_id', logId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get work logs for a specific user
     */
    static async findByUserId(userId, filters = {}) {
        let query = supabase
            .from('work_logs')
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
            .eq('user_id', userId);

        // Apply date range filters
        if (filters.startDate) {
            query = query.gte('work_date', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('work_date', filters.endDate);
        }

        // Apply project filter
        if (filters.projectId) {
            // Use separate queries instead of complex OR with relationships
            const taskQuery = supabase
                .from('work_logs')
                .select(`*,
                    task:tasks(task_id, title, project:projects(project_id, project_name)),
                    subtask:subtasks(
                        subtask_id, title,
                        parent_task:tasks(task_id, title, project:projects(project_id, project_name))
                    ),
                    user:profiles(user_id, username)
                `)
                .not('task_id', 'is', null)
                .eq('task.project_id', filters.projectId);

            const subtaskQuery = supabase
                .from('work_logs')
                .select(`*,
                    task:tasks(task_id, title, project:projects(project_id, project_name)),
                    subtask:subtasks(
                        subtask_id, title,
                        parent_task:tasks(task_id, title, project:projects(project_id, project_name))
                    ),
                    user:profiles(user_id, username)
                `)
                .not('subtask_id', 'is', null)
                .eq('subtask.parent_task.project_id', filters.projectId);

            // Execute both queries and combine results
            const [taskResult, subtaskResult] = await Promise.all([
                taskQuery,
                subtaskQuery
            ]);

            if (taskResult.error) throw taskResult.error;
            if (subtaskResult.error) throw subtaskResult.error;

            const combinedData = [...(taskResult.data || []), ...(subtaskResult.data || [])];
            return combinedData;
        }

        // Apply task filter
        if (filters.taskId) {
            query = query.or(`task_id.eq.${filters.taskId},subtask.parent_task_id.eq.${filters.taskId}`);
        }

        // Apply log type filter
        if (filters.logType) {
            query = query.eq('log_type', filters.logType);
        }

        const { data, error } = await query
            .order('work_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get work logs for a specific task
     */
    static async findByTaskId(taskId) {
        const { data, error } = await supabase
            .from('work_logs')
            .select(`
                *,
                user:profiles!work_logs_user_id_fkey(user_id, username, email, role)
            `)
            .eq('task_id', taskId)
            .order('work_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get work logs for a specific subtask
     */
    static async findBySubtaskId(subtaskId) {
        const { data, error } = await supabase
            .from('work_logs')
            .select(`
                *,
                user:profiles!work_logs_user_id_fkey(user_id, username, email, role)
            `)
            .eq('subtask_id', subtaskId)
            .order('work_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get work logs for a project
     */
    static async findByProjectId(projectId, filters = {}) {
        // Get work logs for tasks directly in the project
        let taskQuery = supabase
            .from('work_logs')
            .select(`
                *,
                task:tasks(
                    task_id,
                    title,
                    project_id
                ),
                subtask:subtasks(
                    subtask_id,
                    title,
                    parent_task:tasks(
                        task_id,
                        title,
                        project_id
                    )
                ),
                user:profiles!work_logs_user_id_fkey(user_id, username, email, role)
            `)
            .not('task_id', 'is', null)
            .eq('task.project_id', projectId);

        // Get work logs for subtasks whose parent task is in the project
        let subtaskQuery = supabase
            .from('work_logs')
            .select(`
                *,
                task:tasks(
                    task_id,
                    title,
                    project_id
                ),
                subtask:subtasks(
                    subtask_id,
                    title,
                    parent_task:tasks(
                        task_id,
                        title,
                        project_id
                    )
                ),
                user:profiles!work_logs_user_id_fkey(user_id, username, email, role)
            `)
            .not('subtask_id', 'is', null)
            .eq('subtask.parent_task.project_id', projectId);

        // Apply filters to both queries
        if (filters.startDate) {
            taskQuery = taskQuery.gte('work_date', filters.startDate);
            subtaskQuery = subtaskQuery.gte('work_date', filters.startDate);
        }
        if (filters.endDate) {
            taskQuery = taskQuery.lte('work_date', filters.endDate);
            subtaskQuery = subtaskQuery.lte('work_date', filters.endDate);
        }
        if (filters.userId) {
            taskQuery = taskQuery.eq('user_id', filters.userId);
            subtaskQuery = subtaskQuery.eq('user_id', filters.userId);
        }
        if (filters.logType) {
            taskQuery = taskQuery.eq('log_type', filters.logType);
            subtaskQuery = subtaskQuery.eq('log_type', filters.logType);
        }

        // Execute both queries
        const [taskResult, subtaskResult] = await Promise.all([
            taskQuery.order('work_date', { ascending: false }).order('created_at', { ascending: false }),
            subtaskQuery.order('work_date', { ascending: false }).order('created_at', { ascending: false })
        ]);

        if (taskResult.error) throw taskResult.error;
        if (subtaskResult.error) throw subtaskResult.error;

        // Combine and sort results
        const allLogs = [...(taskResult.data || []), ...(subtaskResult.data || [])];
        return allLogs.sort((a, b) => {
            const dateA = new Date(a.work_date + ' ' + (a.created_at || '00:00:00'));
            const dateB = new Date(b.work_date + ' ' + (b.created_at || '00:00:00'));
            return dateB - dateA;
        });
    }

    /**
     * Update work log
     */
    static async update(logId, updateData) {
        const { data, error } = await supabase
            .from('work_logs')
            .update(updateData)
            .eq('log_id', logId)
            .select(`
                *,
                task:tasks(task_id, title),
                subtask:subtasks(subtask_id, title),
                user:profiles!work_logs_user_id_fkey(user_id, username, email)
            `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete work log
     */
    static async delete(logId) {
        const { data, error } = await supabase
            .from('work_logs')
            .delete()
            .eq('log_id', logId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get work log statistics for a user
     */
    static async getUserStats(userId, filters = {}) {
        let query = supabase
            .from('work_logs')
            .select('hours_logged, work_date, log_type, task_id, subtask_id')
            .eq('user_id', userId);

        // Apply date range filters
        if (filters.startDate) {
            query = query.gte('work_date', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('work_date', filters.endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        const stats = {
            totalHours: data.reduce((sum, log) => sum + parseFloat(log.hours_logged), 0),
            totalEntries: data.length,
            averageHoursPerDay: 0,
            hoursByType: {},
            hoursByDate: {},
            tasksWorkedOn: new Set(),
            subtasksWorkedOn: new Set()
        };

        // Calculate statistics
        data.forEach(log => {
            const hours = parseFloat(log.hours_logged);
            const date = log.work_date;
            const type = log.log_type;

            // Hours by type
            stats.hoursByType[type] = (stats.hoursByType[type] || 0) + hours;

            // Hours by date
            stats.hoursByDate[date] = (stats.hoursByDate[date] || 0) + hours;

            // Track unique tasks and subtasks
            if (log.task_id) stats.tasksWorkedOn.add(log.task_id);
            if (log.subtask_id) stats.subtasksWorkedOn.add(log.subtask_id);
        });

        // Calculate average hours per day
        const uniqueDates = Object.keys(stats.hoursByDate).length;
        if (uniqueDates > 0) {
            stats.averageHoursPerDay = stats.totalHours / uniqueDates;
        }

        // Convert sets to counts
        stats.tasksWorkedOn = stats.tasksWorkedOn.size;
        stats.subtasksWorkedOn = stats.subtasksWorkedOn.size;

        return stats;
    }

    /**
     * Get work log statistics for a project
     */
    static async getProjectStats(projectId, filters = {}) {
        // Get work logs for tasks directly in the project
        let taskQuery = supabase
            .from('work_logs')
            .select(`
                hours_logged,
                work_date,
                log_type,
                user_id,
                task:tasks(task_id, project_id),
                subtask:subtasks(subtask_id, parent_task:tasks(task_id, project_id))
            `)
            .not('task_id', 'is', null)
            .eq('task.project_id', projectId);

        // Get work logs for subtasks whose parent task is in the project
        let subtaskQuery = supabase
            .from('work_logs')
            .select(`
                hours_logged,
                work_date,
                log_type,
                user_id,
                task:tasks(task_id, project_id),
                subtask:subtasks(subtask_id, parent_task:tasks(task_id, project_id))
            `)
            .not('subtask_id', 'is', null)
            .eq('subtask.parent_task.project_id', projectId);

        // Apply date range filters
        if (filters.startDate) {
            taskQuery = taskQuery.gte('work_date', filters.startDate);
            subtaskQuery = subtaskQuery.gte('work_date', filters.startDate);
        }
        if (filters.endDate) {
            taskQuery = taskQuery.lte('work_date', filters.endDate);
            subtaskQuery = subtaskQuery.lte('work_date', filters.endDate);
        }

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
            totalHours: 0,
            totalEntries: data.length,
            hoursByType: {},
            hoursByDate: {},
            hoursByUser: {},
            uniqueUsers: new Set(),
            uniqueTasks: new Set(),
            uniqueSubtasks: new Set()
        };

        // Calculate statistics
        data.forEach(log => {
            const hours = parseFloat(log.hours_logged);
            const date = log.work_date;
            const type = log.log_type;
            const userId = log.user_id;

            stats.totalHours += hours;

            // Hours by type
            stats.hoursByType[type] = (stats.hoursByType[type] || 0) + hours;

            // Hours by date
            stats.hoursByDate[date] = (stats.hoursByDate[date] || 0) + hours;

            // Hours by user
            stats.hoursByUser[userId] = (stats.hoursByUser[userId] || 0) + hours;

            // Track unique entities
            stats.uniqueUsers.add(userId);
            if (log.task && log.task.project_id === projectId) {
                stats.uniqueTasks.add(log.task.task_id);
            }
            if (log.subtask && log.subtask.parent_task && log.subtask.parent_task.project_id === projectId) {
                stats.uniqueSubtasks.add(log.subtask.subtask_id);
            }
        });

        // Convert sets to counts
        stats.uniqueUsers = stats.uniqueUsers.size;
        stats.uniqueTasks = stats.uniqueTasks.size;
        stats.uniqueSubtasks = stats.uniqueSubtasks.size;

        return stats;
    }

    /**
     * Get recent work logs for dashboard
     */
    static async getRecentLogs(userId = null, limit = 10) {
        let query = supabase
            .from('work_logs')
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
                user:profiles!work_logs_user_id_fkey(user_id, username, email)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Bulk create work logs
     */
    static async createBulk(workLogsData) {
        const { data, error } = await supabase
            .from('work_logs')
            .insert(workLogsData)
            .select(`
                *,
                task:tasks(task_id, title),
                subtask:subtasks(subtask_id, title),
                user:profiles!work_logs_user_id_fkey(user_id, username, email)
            `);

        if (error) throw error;
        return data;
    }
}

module.exports = WorkLog;