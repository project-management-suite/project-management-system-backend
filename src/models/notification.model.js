// src/models/notification.model.js
const { supabase } = require('../config/supabase');

class Notification {
    constructor(data) {
        this.notification_id = data.notification_id;
        this.user_id = data.user_id;
        this.title = data.title;
        this.message = data.message;
        this.type = data.type;
        this.related_entity_type = data.related_entity_type;
        this.related_entity_id = data.related_entity_id;
        this.is_read = data.is_read || false;
        this.email_sent = data.email_sent || false;
        this.created_at = data.created_at;
    }

    static async create({ user_id, title, message, type, related_entity_type = null, related_entity_id = null }) {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id,
                title,
                message,
                type,
                related_entity_type,
                related_entity_id
            })
            .select()
            .single();

        if (error) throw error;
        return new Notification(data);
    }

    static async findByUser(user_id, options = {}) {
        const { limit = 50, offset = 0, unreadOnly = false } = options;

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user_id);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) throw error;
        return data.map(notification => new Notification(notification));
    }

    static async findById(notification_id) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('notification_id', notification_id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return new Notification(data);
    }

    static async markAsRead(notification_id) {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('notification_id', notification_id)
            .select()
            .single();

        if (error) throw error;
        return new Notification(data);
    }

    static async markAllAsRead(user_id) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user_id)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    }

    static async delete(notification_id) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('notification_id', notification_id);

        if (error) throw error;
        return true;
    }

    static async getUserNotificationStats(user_id) {
        const { data, error } = await supabase
            .from('notifications')
            .select('is_read, type, created_at')
            .eq('user_id', user_id);

        if (error) throw error;

        const stats = {
            total: data.length,
            unread: data.filter(n => !n.is_read).length,
            read: data.filter(n => n.is_read).length,
            by_type: {},
            recent_count: 0
        };

        // Count by type
        data.forEach(notification => {
            stats.by_type[notification.type] = (stats.by_type[notification.type] || 0) + 1;

            // Count recent notifications (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (new Date(notification.created_at) > weekAgo) {
                stats.recent_count++;
            }
        });

        return stats;
    }

    // Bulk notification methods
    static async createBulk(notifications) {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) throw error;
        return data.map(notification => new Notification(notification));
    }

    static async deleteMultiple(notification_ids) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .in('notification_id', notification_ids);

        if (error) throw error;
        return true;
    }

    // Notification type helpers
    static async createTaskNotification(user_id, task_id, task_title, type, message) {
        return this.create({
            user_id,
            title: `Task: ${task_title}`,
            message,
            type,
            related_entity_type: 'task',
            related_entity_id: task_id
        });
    }

    static async createProjectNotification(user_id, project_id, project_name, type, message) {
        return this.create({
            user_id,
            title: `Project: ${project_name}`,
            message,
            type,
            related_entity_type: 'project',
            related_entity_id: project_id
        });
    }

    static async createMilestoneNotification(user_id, milestone_id, milestone_name, type, message) {
        return this.create({
            user_id,
            title: `Milestone: ${milestone_name}`,
            message,
            type,
            related_entity_type: 'milestone',
            related_entity_id: milestone_id
        });
    }

    static async createSystemNotification(user_id, title, message) {
        return this.create({
            user_id,
            title,
            message,
            type: 'SYSTEM'
        });
    }
}

class NotificationPreference {
    constructor(data) {
        this.user_id = data.user_id;
        this.email_notifications = data.email_notifications;
        this.task_assignments = data.task_assignments;
        this.deadline_reminders = data.deadline_reminders;
        this.status_updates = data.status_updates;
        this.weekly_digest = data.weekly_digest;
        this.milestone_updates = data.milestone_updates;
        this.updated_at = data.updated_at;
    }

    static async findByUser(user_id) {
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return new NotificationPreference(data);
    }

    static async upsert(user_id, preferences) {
        const { data, error } = await supabase
            .from('notification_preferences')
            .upsert({
                user_id,
                ...preferences
            })
            .select()
            .single();

        if (error) throw error;
        return new NotificationPreference(data);
    }

    static async createDefault(user_id) {
        const defaultPrefs = {
            user_id,
            email_notifications: true,
            task_assignments: true,
            deadline_reminders: true,
            status_updates: true,
            weekly_digest: false,
            milestone_updates: true
        };

        return this.upsert(user_id, defaultPrefs);
    }

    static async shouldSendNotification(user_id, notification_type) {
        const preferences = await this.findByUser(user_id);
        if (!preferences) return true; // Default to sending if no preferences set

        const typeMap = {
            'TASK_ASSIGNED': 'task_assignments',
            'TASK_COMPLETED': 'status_updates',
            'TASK_OVERDUE': 'deadline_reminders',
            'DEADLINE_REMINDER': 'deadline_reminders',
            'PROJECT_UPDATED': 'status_updates',
            'MILESTONE_COMPLETED': 'milestone_updates',
            'MILESTONE_OVERDUE': 'deadline_reminders',
            'WEEKLY_DIGEST': 'weekly_digest'
        };

        const preferenceKey = typeMap[notification_type];
        return preferenceKey ? preferences[preferenceKey] : true;
    }
}

module.exports = { Notification, NotificationPreference };