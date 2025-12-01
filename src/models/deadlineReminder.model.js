// src/models/deadlineReminder.model.js
const { supabase } = require('../config/supabase');

class DeadlineReminder {
    constructor(data = {}) {
        this.reminder_id = data.reminder_id;
        this.task_id = data.task_id;
        this.user_id = data.user_id;
        this.reminder_date = data.reminder_date;
        this.reminder_type = data.reminder_type || 'email';
        this.sent = data.sent || false;
        this.created_at = data.created_at;
    }

    /**
     * Create a new deadline reminder
     */
    static async create(reminderData) {
        const { data, error } = await supabase
            .from('deadline_reminders')
            .insert({
                task_id: reminderData.task_id,
                user_id: reminderData.user_id,
                reminder_date: reminderData.reminder_date,
                reminder_type: reminderData.reminder_type || 'email'
            })
            .select(`
        *,
        tasks(task_id, title, description, end_date, status),
        profiles(user_id, username, email)
      `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Create multiple reminders for a task with smart scheduling
     */
    static async createSmartReminders(taskId, userId, options = {}) {
        const {
            reminderTypes = ['24hours', '1week', '3days'],
            customDates = [],
            reminderMethod = 'email'
        } = options;

        // Get task details
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('task_id, title, end_date')
            .eq('task_id', taskId)
            .single();

        if (taskError) throw taskError;
        if (!task.end_date) throw new Error('Task must have an end date to set reminders');

        const taskDeadline = new Date(task.end_date);
        const now = new Date();
        const reminders = [];

        // Create standard reminders based on priority
        for (const type of reminderTypes) {
            let reminderDate;

            switch (type) {
                case '24hours':
                    reminderDate = new Date(taskDeadline.getTime() - (24 * 60 * 60 * 1000));
                    break;
                case '3days':
                    reminderDate = new Date(taskDeadline.getTime() - (3 * 24 * 60 * 60 * 1000));
                    break;
                case '1week':
                    reminderDate = new Date(taskDeadline.getTime() - (7 * 24 * 60 * 60 * 1000));
                    break;
                case '2weeks':
                    reminderDate = new Date(taskDeadline.getTime() - (14 * 24 * 60 * 60 * 1000));
                    break;
                default:
                    continue;
            }

            // Only create reminders that are in the future
            if (reminderDate > now) {
                reminders.push({
                    task_id: taskId,
                    user_id: userId,
                    reminder_date: reminderDate.toISOString(),
                    reminder_type: reminderMethod
                });
            }
        }

        // Add custom reminder dates
        for (const customDate of customDates) {
            const reminderDate = new Date(customDate);
            if (reminderDate > now && reminderDate < taskDeadline) {
                reminders.push({
                    task_id: taskId,
                    user_id: userId,
                    reminder_date: reminderDate.toISOString(),
                    reminder_type: reminderMethod
                });
            }
        }

        if (reminders.length === 0) {
            return { success: true, reminders: [], message: 'No future reminders to create' };
        }

        // Bulk insert reminders
        const { data, error } = await supabase
            .from('deadline_reminders')
            .insert(reminders)
            .select(`
        *,
        tasks(task_id, title, end_date),
        profiles(user_id, username, email)
      `);

        if (error) throw error;
        return { success: true, reminders: data };
    }

    /**
     * Get reminders for a user
     */
    static async getUserReminders(userId, options = {}) {
        const {
            limit = 50,
            offset = 0,
            pendingOnly = false,
            includeTask = true
        } = options;

        let query = supabase
            .from('deadline_reminders')
            .select(includeTask ? `
        *,
        tasks(
          task_id, title, description, end_date, status,
          projects(project_id, project_name)
        )
      ` : '*')
            .eq('user_id', userId)
            .order('reminder_date', { ascending: true })
            .range(offset, offset + limit - 1);

        if (pendingOnly) {
            query = query.eq('sent', false);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Get pending reminders that need to be sent
     */
    static async getPendingReminders(batchSize = 100) {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('deadline_reminders')
            .select(`
        *,
        tasks(
          task_id, title, description, end_date, status,
          projects(project_id, project_name, owner_manager_id)
        ),
        profiles(
          user_id, username, email,
          notification_preferences(deadline_reminders, email_notifications)
        )
      `)
            .eq('sent', false)
            .lte('reminder_date', now)
            .limit(batchSize)
            .order('reminder_date', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Mark reminders as sent
     */
    static async markAsSent(reminderIds) {
        const { data, error } = await supabase
            .from('deadline_reminders')
            .update({ sent: true })
            .in('reminder_id', reminderIds)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Get overdue reminders (tasks past deadline with unsent reminders)
     */
    static async getOverdueReminders() {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('deadline_reminders')
            .select(`
        *,
        tasks!inner(
          task_id, title, end_date, status,
          projects(project_id, project_name)
        ),
        profiles(user_id, username, email)
      `)
            .eq('sent', false)
            .lt('tasks.end_date', now)
            .neq('tasks.status', 'COMPLETED');

        if (error) throw error;
        return data;
    }

    /**
     * Update reminder
     */
    static async updateReminder(reminderId, updateData) {
        const { data, error } = await supabase
            .from('deadline_reminders')
            .update(updateData)
            .eq('reminder_id', reminderId)
            .select(`
        *,
        tasks(task_id, title, end_date),
        profiles(user_id, username, email)
      `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete reminder
     */
    static async deleteReminder(reminderId) {
        const { data, error } = await supabase
            .from('deadline_reminders')
            .delete()
            .eq('reminder_id', reminderId)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error('Reminder not found');
        }

        return data[0];
    }

    /**
     * Delete all reminders for a task
     */
    static async deleteTaskReminders(taskId) {
        const { data, error } = await supabase
            .from('deadline_reminders')
            .delete()
            .eq('task_id', taskId)
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Get reminder statistics for a user
     */
    static async getUserReminderStats(userId) {
        const { data, error } = await supabase
            .from('deadline_reminders')
            .select('reminder_id, sent, reminder_date')
            .eq('user_id', userId);

        if (error) throw error;

        const now = new Date();
        const stats = {
            total_reminders: data.length,
            pending_reminders: data.filter(r => !r.sent && new Date(r.reminder_date) > now).length,
            sent_reminders: data.filter(r => r.sent).length,
            overdue_reminders: data.filter(r => !r.sent && new Date(r.reminder_date) <= now).length
        };

        return stats;
    }

    /**
     * Create escalation reminders for overdue tasks
     */
    static async createEscalationReminders(taskId, managerId, escalationDays = [1, 3, 7]) {
        const now = new Date();
        const reminders = [];

        for (const days of escalationDays) {
            const reminderDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
            reminders.push({
                task_id: taskId,
                user_id: managerId,
                reminder_date: reminderDate.toISOString(),
                reminder_type: 'both'
            });
        }

        const { data, error } = await supabase
            .from('deadline_reminders')
            .insert(reminders)
            .select(`
        *,
        tasks(task_id, title, end_date),
        profiles(user_id, username, email)
      `);

        if (error) throw error;
        return data;
    }

    /**
     * Get reminder analytics
     */
    static async getReminderAnalytics(dateFrom, dateTo) {
        let query = supabase
            .from('deadline_reminders')
            .select(`
        reminder_id, sent, reminder_date, reminder_type,
        tasks(status, end_date)
      `);

        if (dateFrom) {
            query = query.gte('reminder_date', dateFrom);
        }
        if (dateTo) {
            query = query.lte('reminder_date', dateTo);
        }

        const { data, error } = await query;
        if (error) throw error;

        const analytics = {
            total_reminders: data.length,
            sent_reminders: data.filter(r => r.sent).length,
            pending_reminders: data.filter(r => !r.sent).length,
            by_type: {},
            effectiveness: {
                tasks_completed_after_reminder: 0,
                tasks_still_pending: 0
            }
        };

        // Group by type
        data.forEach(reminder => {
            analytics.by_type[reminder.reminder_type] =
                (analytics.by_type[reminder.reminder_type] || 0) + 1;

            // Calculate effectiveness
            if (reminder.sent && reminder.tasks?.status === 'COMPLETED') {
                analytics.effectiveness.tasks_completed_after_reminder++;
            } else if (reminder.sent && reminder.tasks?.status !== 'COMPLETED') {
                analytics.effectiveness.tasks_still_pending++;
            }
        });

        return analytics;
    }
}

module.exports = DeadlineReminder;