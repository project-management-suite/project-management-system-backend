// src/models/analyticsSnapshot.model.js
const { supabase } = require('../config/supabase');

class AnalyticsSnapshot {
    constructor(data = {}) {
        this.snapshot_id = data.snapshot_id;
        this.entity_type = data.entity_type;
        this.entity_id = data.entity_id;
        this.metrics = data.metrics;
        this.snapshot_date = data.snapshot_date;
        this.created_at = data.created_at;
    }

    /**
     * Create a new analytics snapshot
     */
    static async create(snapshotData) {
        const { data, error } = await supabase
            .from('analytics_snapshots')
            .insert({
                entity_type: snapshotData.entity_type,
                entity_id: snapshotData.entity_id,
                metrics: snapshotData.metrics,
                snapshot_date: snapshotData.snapshot_date || new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Generate and store project analytics snapshot
     */
    static async generateProjectSnapshot(projectId, date = null) {
        const snapshotDate = date || new Date().toISOString().split('T')[0];

        // Get project metrics
        const projectMetrics = await this.calculateProjectMetrics(projectId, snapshotDate);

        return await this.create({
            entity_type: 'project',
            entity_id: projectId,
            metrics: projectMetrics,
            snapshot_date: snapshotDate
        });
    }

    /**
     * Generate and store user analytics snapshot
     */
    static async generateUserSnapshot(userId, date = null) {
        const snapshotDate = date || new Date().toISOString().split('T')[0];

        // Get user metrics
        const userMetrics = await this.calculateUserMetrics(userId, snapshotDate);

        return await this.create({
            entity_type: 'user',
            entity_id: userId,
            metrics: userMetrics,
            snapshot_date: snapshotDate
        });
    }

    /**
     * Generate and store system-wide analytics snapshot
     */
    static async generateSystemSnapshot(date = null) {
        const snapshotDate = date || new Date().toISOString().split('T')[0];

        // Get system-wide metrics
        const systemMetrics = await this.calculateSystemMetrics(snapshotDate);

        return await this.create({
            entity_type: 'system',
            entity_id: null,
            metrics: systemMetrics,
            snapshot_date: snapshotDate
        });
    }

    /**
     * Calculate comprehensive project metrics
     */
    static async calculateProjectMetrics(projectId, date) {
        const dateFilter = `<= '${date} 23:59:59'`;

        // Get project basic info
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('project_name, status, start_date, end_date, created_at')
            .eq('project_id', projectId)
            .single();

        if (projectError) throw projectError;

        // Get task metrics
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('task_id, status, priority, created_at, start_date, end_date, actual_hours')
            .eq('project_id', projectId)
            .lte('created_at', dateFilter);

        if (tasksError) throw tasksError;

        // Get milestone metrics
        const { data: milestones, error: milestonesError } = await supabase
            .from('milestones')
            .select('milestone_id, status, due_date, completion_date, progress_percentage')
            .eq('project_id', projectId)
            .lte('created_at', dateFilter);

        if (milestonesError) throw milestonesError;

        // Get file metrics
        const { data: files, error: filesError } = await supabase
            .from('files')
            .select('file_id, file_size, upload_date')
            .eq('project_id', projectId)
            .lte('upload_date', dateFilter);

        if (filesError) throw filesError;

        // Calculate metrics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
        const overdueTasks = tasks.filter(t =>
            t.end_date && new Date(t.end_date) < new Date(date) && t.status !== 'COMPLETED'
        ).length;

        const totalMilestones = milestones.length;
        const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
        const averageMilestoneProgress = milestones.length > 0
            ? milestones.reduce((sum, m) => sum + (m.progress_percentage || 0), 0) / milestones.length
            : 0;

        const totalFiles = files.length;
        const totalFileSize = files.reduce((sum, f) => sum + (f.file_size || 0), 0);

        const totalHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

        return {
            project_info: {
                name: project.project_name,
                status: project.status,
                created_at: project.created_at,
                start_date: project.start_date,
                end_date: project.end_date
            },
            task_metrics: {
                total_tasks: totalTasks,
                completed_tasks: completedTasks,
                in_progress_tasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
                pending_tasks: tasks.filter(t => t.status === 'PENDING').length,
                overdue_tasks: overdueTasks,
                completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                by_priority: {
                    high: tasks.filter(t => t.priority === 'HIGH').length,
                    medium: tasks.filter(t => t.priority === 'MEDIUM').length,
                    low: tasks.filter(t => t.priority === 'LOW').length
                }
            },
            milestone_metrics: {
                total_milestones: totalMilestones,
                completed_milestones: completedMilestones,
                average_progress: Math.round(averageMilestoneProgress),
                completion_rate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
            },
            file_metrics: {
                total_files: totalFiles,
                total_file_size: totalFileSize,
                average_file_size: totalFiles > 0 ? Math.round(totalFileSize / totalFiles) : 0
            },
            time_metrics: {
                total_hours: totalHours,
                average_hours_per_task: totalTasks > 0 ? Math.round(totalHours / totalTasks * 100) / 100 : 0
            },
            snapshot_date: date,
            snapshot_timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate comprehensive user metrics
     */
    static async calculateUserMetrics(userId, date) {
        const dateFilter = `<= '${date} 23:59:59'`;

        // Get user info
        const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('first_name, last_name, role, created_at')
            .eq('user_id', userId)
            .single();

        if (userError) throw userError;

        // Get assigned tasks
        const { data: assignments, error: assignmentsError } = await supabase
            .from('task_assignments')
            .select(`
        assignment_id, assigned_at,
        task:tasks(
          task_id, status, priority, created_at, start_date, end_date, 
          actual_hours, project_id
        )
      `)
            .eq('developer_id', userId)
            .lte('assigned_at', dateFilter);

        if (assignmentsError) throw assignmentsError;

        const tasks = assignments.map(a => a.task);

        // Get files uploaded by user
        const { data: files, error: filesError } = await supabase
            .from('files')
            .select('file_id, file_size, upload_date')
            .eq('uploaded_by_user_id', userId)
            .lte('upload_date', dateFilter);

        if (filesError) throw filesError;

        // Get notifications
        const { data: notifications, error: notificationsError } = await supabase
            .from('notifications')
            .select('notification_id, is_read, created_at')
            .eq('user_id', userId)
            .lte('created_at', dateFilter);

        if (notificationsError) throw notificationsError;

        // Calculate metrics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
        const overdueTasks = tasks.filter(t =>
            t.end_date && new Date(t.end_date) < new Date(date) && t.status !== 'COMPLETED'
        ).length;

        const totalHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);
        const uniqueProjects = new Set(tasks.map(t => t.project_id)).size;

        const totalFiles = files.length;
        const totalFileSize = files.reduce((sum, f) => sum + (f.file_size || 0), 0);

        const totalNotifications = notifications.length;
        const readNotifications = notifications.filter(n => n.is_read).length;

        return {
            user_info: {
                name: `${user.first_name} ${user.last_name}`,
                role: user.role,
                created_at: user.created_at
            },
            task_metrics: {
                total_assigned: totalTasks,
                completed: completedTasks,
                in_progress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
                pending: tasks.filter(t => t.status === 'PENDING').length,
                overdue: overdueTasks,
                completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                by_priority: {
                    high: tasks.filter(t => t.priority === 'HIGH').length,
                    medium: tasks.filter(t => t.priority === 'MEDIUM').length,
                    low: tasks.filter(t => t.priority === 'LOW').length
                }
            },
            project_metrics: {
                unique_projects: uniqueProjects,
                total_hours: totalHours,
                average_hours_per_task: totalTasks > 0 ? Math.round(totalHours / totalTasks * 100) / 100 : 0
            },
            file_metrics: {
                files_uploaded: totalFiles,
                total_upload_size: totalFileSize
            },
            engagement_metrics: {
                total_notifications: totalNotifications,
                read_notifications: readNotifications,
                notification_read_rate: totalNotifications > 0 ? Math.round((readNotifications / totalNotifications) * 100) : 0
            },
            snapshot_date: date,
            snapshot_timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate system-wide metrics
     */
    static async calculateSystemMetrics(date) {
        const dateFilter = `<= '${date} 23:59:59'`;

        // Get all users count
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('user_id, role, created_at')
            .lte('created_at', dateFilter);

        if (usersError) throw usersError;

        // Get all projects
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('project_id, status, created_at, start_date, end_date')
            .lte('created_at', dateFilter);

        if (projectsError) throw projectsError;

        // Get all tasks
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('task_id, status, priority, created_at, actual_hours')
            .lte('created_at', dateFilter);

        if (tasksError) throw tasksError;

        // Get all files
        const { data: files, error: filesError } = await supabase
            .from('files')
            .select('file_id, file_size, upload_date')
            .lte('upload_date', dateFilter);

        if (filesError) throw filesError;

        // Calculate metrics
        const totalUsers = users.length;
        const usersByRole = {
            admin: users.filter(u => u.role === 'ADMIN').length,
            manager: users.filter(u => u.role === 'MANAGER').length,
            developer: users.filter(u => u.role === 'DEVELOPER').length
        };

        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
        const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
        const totalHours = tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);

        const totalFiles = files.length;
        const totalStorage = files.reduce((sum, f) => sum + (f.file_size || 0), 0);

        return {
            user_metrics: {
                total_users: totalUsers,
                by_role: usersByRole,
                new_users_today: users.filter(u =>
                    u.created_at && u.created_at.startsWith(date)
                ).length
            },
            project_metrics: {
                total_projects: totalProjects,
                active_projects: activeProjects,
                completed_projects: completedProjects,
                project_completion_rate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
            },
            task_metrics: {
                total_tasks: totalTasks,
                completed_tasks: completedTasks,
                task_completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                total_hours: totalHours,
                average_hours_per_task: totalTasks > 0 ? Math.round(totalHours / totalTasks * 100) / 100 : 0
            },
            file_metrics: {
                total_files: totalFiles,
                total_storage: totalStorage,
                average_file_size: totalFiles > 0 ? Math.round(totalStorage / totalFiles) : 0
            },
            system_health: {
                active_projects_percentage: totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0,
                user_engagement: Math.round((completedTasks / Math.max(totalUsers, 1)) * 100) / 100
            },
            snapshot_date: date,
            snapshot_timestamp: new Date().toISOString()
        };
    }

    /**
     * Get snapshots by entity
     */
    static async getSnapshots(entityType, entityId = null, options = {}) {
        const {
            limit = 50,
            offset = 0,
            dateFrom = null,
            dateTo = null,
            orderBy = 'snapshot_date',
            orderDirection = 'desc'
        } = options;

        let query = supabase
            .from('analytics_snapshots')
            .select('*')
            .eq('entity_type', entityType)
            .order(orderBy, { ascending: orderDirection === 'asc' })
            .range(offset, offset + limit - 1);

        if (entityId) {
            query = query.eq('entity_id', entityId);
        }

        if (dateFrom) {
            query = query.gte('snapshot_date', dateFrom);
        }

        if (dateTo) {
            query = query.lte('snapshot_date', dateTo);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Get latest snapshot for entity
     */
    static async getLatestSnapshot(entityType, entityId = null) {
        let query = supabase
            .from('analytics_snapshots')
            .select('*')
            .eq('entity_type', entityType)
            .order('snapshot_date', { ascending: false })
            .limit(1);

        if (entityId) {
            query = query.eq('entity_id', entityId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data[0] || null;
    }

    /**
     * Generate trend analysis
     */
    static async getTrendAnalysis(entityType, entityId = null, days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        const snapshots = await this.getSnapshots(entityType, entityId, {
            dateFrom: startDate.toISOString().split('T')[0],
            dateTo: endDate.toISOString().split('T')[0],
            orderBy: 'snapshot_date',
            orderDirection: 'asc',
            limit: days
        });

        if (snapshots.length < 2) {
            return { trend: 'insufficient_data', snapshots: snapshots.length };
        }

        const latest = snapshots[snapshots.length - 1];
        const previous = snapshots[snapshots.length - 2];

        // Calculate trend for key metrics based on entity type
        const trends = {};

        if (entityType === 'project' || entityType === 'user') {
            const latestCompletion = latest.metrics.task_metrics?.completion_rate || 0;
            const previousCompletion = previous.metrics.task_metrics?.completion_rate || 0;
            trends.task_completion = latestCompletion - previousCompletion;
        }

        if (entityType === 'system') {
            const latestUsers = latest.metrics.user_metrics?.total_users || 0;
            const previousUsers = previous.metrics.user_metrics?.total_users || 0;
            trends.user_growth = latestUsers - previousUsers;

            const latestProjects = latest.metrics.project_metrics?.total_projects || 0;
            const previousProjects = previous.metrics.project_metrics?.total_projects || 0;
            trends.project_growth = latestProjects - previousProjects;
        }

        return {
            entity_type: entityType,
            entity_id: entityId,
            period_days: days,
            snapshots_analyzed: snapshots.length,
            trends,
            latest_snapshot: latest,
            snapshots
        };
    }

    /**
     * Delete old snapshots (cleanup)
     */
    static async cleanupOldSnapshots(daysToKeep = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('analytics_snapshots')
            .delete()
            .lt('snapshot_date', cutoffDateStr)
            .select();

        if (error) throw error;
        return data;
    }
}

module.exports = AnalyticsSnapshot;