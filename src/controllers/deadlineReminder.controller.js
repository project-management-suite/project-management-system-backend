// src/controllers/deadlineReminder.controller.js
const DeadlineReminder = require('../models/deadlineReminder.model');
const { sendEmail } = require('../utils/mailer');
const Notification = require('../models/notification.model');
const { supabase } = require('../config/supabase');

/**
 * Create a new deadline reminder
 */
exports.createReminder = async (req, res) => {
    try {
        const { task_id, reminder_date, reminder_type = 'email' } = req.body;

        if (!task_id || !reminder_date) {
            return res.status(400).json({ error: 'Task ID and reminder date are required' });
        }

        // Validate reminder date is in the future
        const reminderDateTime = new Date(reminder_date);
        if (reminderDateTime <= new Date()) {
            return res.status(400).json({ error: 'Reminder date must be in the future' });
        }

        const reminder = await DeadlineReminder.create({
            task_id,
            user_id: req.user.user_id,
            reminder_date: reminderDateTime.toISOString(),
            reminder_type
        });

        res.status(201).json({
            success: true,
            message: 'Deadline reminder created successfully',
            reminder
        });

    } catch (error) {
        console.error('Create reminder error:', error);

        if (error.code === '23505') {
            return res.status(409).json({ error: 'Reminder already exists for this date' });
        }

        if (error.code === '23503') {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.status(500).json({ error: 'Failed to create reminder' });
    }
};

/**
 * Create smart reminders with automatic scheduling
 */
exports.createSmartReminders = async (req, res) => {
    try {
        const { task_id, reminder_types, custom_dates, reminder_method } = req.body;

        if (!task_id) {
            return res.status(400).json({ error: 'Task ID is required' });
        }

        const result = await DeadlineReminder.createSmartReminders(
            task_id,
            req.user.user_id,
            {
                reminderTypes: reminder_types,
                customDates: custom_dates,
                reminderMethod: reminder_method
            }
        );

        res.status(201).json({
            success: true,
            message: `Created ${result.reminders.length} smart reminders`,
            ...result
        });

    } catch (error) {
        console.error('Create smart reminders error:', error);

        if (error.message.includes('Task must have an end date')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to create smart reminders' });
    }
};

/**
 * Get user's reminders
 */
exports.getUserReminders = async (req, res) => {
    try {
        const {
            limit = 50,
            offset = 0,
            pending_only = false
        } = req.query;

        const reminders = await DeadlineReminder.getUserReminders(
            req.user.user_id,
            {
                limit: parseInt(limit),
                offset: parseInt(offset),
                pendingOnly: pending_only === 'true'
            }
        );

        res.json({
            success: true,
            reminders,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: reminders.length
            }
        });

    } catch (error) {
        console.error('Get user reminders error:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
};

/**
 * Get reminder by ID
 */
exports.getReminder = async (req, res) => {
    try {
        const { reminderId } = req.params;

        const { data: reminder, error } = await supabase
            .from('deadline_reminders')
            .select(`
        *,
        tasks(
          task_id, title, description, end_date, status,
          projects(project_id, project_name)
        ),
        profiles(user_id, username, email)
      `)
            .eq('reminder_id', reminderId)
            .eq('user_id', req.user.user_id)
            .single();

        if (error || !reminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        res.json({
            success: true,
            reminder
        });

    } catch (error) {
        console.error('Get reminder error:', error);
        res.status(500).json({ error: 'Failed to fetch reminder' });
    }
};

/**
 * Update reminder
 */
exports.updateReminder = async (req, res) => {
    try {
        const { reminderId } = req.params;
        const { reminder_date, reminder_type } = req.body;

        const updateData = {};

        if (reminder_date) {
            const reminderDateTime = new Date(reminder_date);
            if (reminderDateTime <= new Date()) {
                return res.status(400).json({ error: 'Reminder date must be in the future' });
            }
            updateData.reminder_date = reminderDateTime.toISOString();
        }

        if (reminder_type) {
            updateData.reminder_type = reminder_type;
        }

        // Reset sent status if date is updated
        if (reminder_date) {
            updateData.sent = false;
        }

        const reminder = await DeadlineReminder.updateReminder(reminderId, updateData);

        res.json({
            success: true,
            message: 'Reminder updated successfully',
            reminder
        });

    } catch (error) {
        console.error('Update reminder error:', error);
        res.status(500).json({ error: 'Failed to update reminder' });
    }
};

/**
 * Delete reminder
 */
exports.deleteReminder = async (req, res) => {
    try {
        const { reminderId } = req.params;

        const reminder = await DeadlineReminder.deleteReminder(reminderId);

        res.json({
            success: true,
            message: 'Reminder deleted successfully',
            reminder
        });

    } catch (error) {
        console.error('Delete reminder error:', error);

        if (error.message === 'Reminder not found' || error.code === '23502') {
            return res.status(404).json({ error: 'Reminder not found' });
        }

        res.status(500).json({ error: 'Failed to delete reminder' });
    }
};

/**
 * Get pending reminders (Admin/Manager only)
 */
exports.getPendingReminders = async (req, res) => {
    try {
        const { batch_size = 100 } = req.query;

        const reminders = await DeadlineReminder.getPendingReminders(
            parseInt(batch_size)
        );

        res.json({
            success: true,
            reminders,
            count: reminders.length
        });

    } catch (error) {
        console.error('Get pending reminders error:', error);
        res.status(500).json({ error: 'Failed to fetch pending reminders' });
    }
};

/**
 * Process and send pending reminders (Admin/Manager only)
 */
exports.processPendingReminders = async (req, res) => {
    try {
        const pendingReminders = await DeadlineReminder.getPendingReminders(50);
        const results = {
            processed: 0,
            sent: 0,
            failed: 0,
            errors: []
        };

        for (const reminder of pendingReminders) {
            try {
                results.processed++;

                // Check if user wants this type of reminder
                const wantsReminder = reminder.profiles?.notification_preferences?.deadline_reminders !== false;
                const wantsEmail = reminder.profiles?.notification_preferences?.email_notifications !== false;

                if (!wantsReminder) {
                    continue;
                }

                // Create in-app notification
                await Notification.create({
                    user_id: reminder.user_id,
                    title: 'Task Deadline Reminder',
                    message: `Task "${reminder.tasks.title}" is due on ${new Date(reminder.tasks.end_date).toLocaleDateString()}`,
                    type: 'DEADLINE_REMINDER',
                    related_entity_type: 'task',
                    related_entity_id: reminder.task_id
                });

                // Send email if requested and enabled
                if ((reminder.reminder_type === 'email' || reminder.reminder_type === 'both') && wantsEmail) {
                    await sendEmail({
                        to: reminder.profiles.email,
                        subject: `Task Deadline Reminder: ${reminder.tasks.title}`,
                        template: 'deadline_reminder',
                        data: {
                            userName: `${reminder.profiles.first_name} ${reminder.profiles.last_name}`,
                            taskTitle: reminder.tasks.title,
                            taskDescription: reminder.tasks.description,
                            dueDate: new Date(reminder.tasks.end_date).toLocaleDateString(),
                            projectName: reminder.tasks.projects?.project_name || 'Unknown Project',
                            priority: reminder.tasks.priority
                        }
                    });
                }

                // Mark as sent
                await DeadlineReminder.markAsSent([reminder.reminder_id]);
                results.sent++;

            } catch (error) {
                console.error(`Failed to process reminder ${reminder.reminder_id}:`, error);
                results.failed++;
                results.errors.push({
                    reminder_id: reminder.reminder_id,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Processed ${results.processed} reminders`,
            results
        });

    } catch (error) {
        console.error('Process pending reminders error:', error);
        res.status(500).json({ error: 'Failed to process pending reminders' });
    }
};

/**
 * Get overdue task reminders (Admin/Manager only)
 */
exports.getOverdueReminders = async (req, res) => {
    try {
        const reminders = await DeadlineReminder.getOverdueReminders();

        res.json({
            success: true,
            reminders,
            count: reminders.length
        });

    } catch (error) {
        console.error('Get overdue reminders error:', error);
        res.status(500).json({ error: 'Failed to fetch overdue reminders' });
    }
};

/**
 * Create escalation reminders for overdue tasks (Admin/Manager only)
 */
exports.createEscalationReminders = async (req, res) => {
    try {
        const { task_id, manager_id, escalation_days } = req.body;

        if (!task_id || !manager_id) {
            return res.status(400).json({
                error: 'Task ID and manager ID are required'
            });
        }

        const reminders = await DeadlineReminder.createEscalationReminders(
            task_id,
            manager_id,
            escalation_days
        );

        res.status(201).json({
            success: true,
            message: `Created ${reminders.length} escalation reminders`,
            reminders
        });

    } catch (error) {
        console.error('Create escalation reminders error:', error);
        res.status(500).json({ error: 'Failed to create escalation reminders' });
    }
};

/**
 * Get reminder statistics for current user
 */
exports.getUserReminderStats = async (req, res) => {
    try {
        const stats = await DeadlineReminder.getUserReminderStats(req.user.user_id);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get user reminder stats error:', error);
        res.status(500).json({ error: 'Failed to fetch reminder statistics' });
    }
};

/**
 * Get reminder analytics (Admin/Manager only)
 */
exports.getReminderAnalytics = async (req, res) => {
    try {
        const { date_from, date_to } = req.query;

        const analytics = await DeadlineReminder.getReminderAnalytics(
            date_from,
            date_to
        );

        res.json({
            success: true,
            analytics,
            period: {
                from: date_from || 'all time',
                to: date_to || 'present'
            }
        });

    } catch (error) {
        console.error('Get reminder analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch reminder analytics' });
    }
};

/**
 * Bulk delete reminders for a task (Admin/Manager only)
 */
exports.deleteTaskReminders = async (req, res) => {
    try {
        const { taskId } = req.params;

        const deletedReminders = await DeadlineReminder.deleteTaskReminders(taskId);

        res.json({
            success: true,
            message: `Deleted ${deletedReminders.length} reminders for task`,
            deleted_reminders: deletedReminders
        });

    } catch (error) {
        console.error('Delete task reminders error:', error);
        res.status(500).json({ error: 'Failed to delete task reminders' });
    }
};