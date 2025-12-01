// src/controllers/notification.controller.js
const { Notification, NotificationPreference } = require('../models/notification.model');

exports.getNotifications = async (req, res) => {
    try {
        const { limit = 50, offset = 0, unread_only = false } = req.query;

        const notifications = await Notification.findByUser(req.user.user_id, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            unreadOnly: unread_only === 'true'
        });

        const stats = await Notification.getUserNotificationStats(req.user.user_id);

        res.json({
            success: true,
            notifications,
            stats,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: stats.total
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};

exports.getNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check if user owns this notification
        if (notification.user_id !== req.user.user_id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Get notification error:', error);
        res.status(500).json({
            message: 'Failed to fetch notification',
            error: error.message
        });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check if user owns this notification
        if (notification.user_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const updatedNotification = await Notification.markAsRead(notificationId);

        res.json({
            success: true,
            message: 'Notification marked as read',
            notification: updatedNotification
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.user_id);

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check if user owns this notification
        if (notification.user_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Notification.delete(notificationId);

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

exports.deleteMultipleNotifications = async (req, res) => {
    try {
        const { notification_ids } = req.body;

        if (!notification_ids || !Array.isArray(notification_ids)) {
            return res.status(400).json({
                message: 'notification_ids array is required'
            });
        }

        // Verify all notifications belong to the user
        for (const id of notification_ids) {
            const notification = await Notification.findById(id);
            if (!notification || notification.user_id !== req.user.user_id) {
                return res.status(403).json({
                    message: `Access denied for notification ${id}`
                });
            }
        }

        await Notification.deleteMultiple(notification_ids);

        res.json({
            success: true,
            message: `${notification_ids.length} notifications deleted successfully`
        });
    } catch (error) {
        console.error('Delete multiple notifications error:', error);
        res.status(500).json({
            message: 'Failed to delete notifications',
            error: error.message
        });
    }
};

exports.getNotificationStats = async (req, res) => {
    try {
        const stats = await Notification.getUserNotificationStats(req.user.user_id);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            message: 'Failed to fetch notification statistics',
            error: error.message
        });
    }
};

// Notification preferences management
exports.getNotificationPreferences = async (req, res) => {
    try {
        let preferences = await NotificationPreference.findByUser(req.user.user_id);

        if (!preferences) {
            preferences = await NotificationPreference.createDefault(req.user.user_id);
        }

        res.json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({
            message: 'Failed to fetch notification preferences',
            error: error.message
        });
    }
};

exports.updateNotificationPreferences = async (req, res) => {
    try {
        const preferences = await NotificationPreference.upsert(req.user.user_id, req.body);

        res.json({
            success: true,
            message: 'Notification preferences updated successfully',
            preferences
        });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({
            message: 'Failed to update notification preferences',
            error: error.message
        });
    }
};

// Admin endpoints
exports.createNotification = async (req, res) => {
    try {
        const { user_id, title, message, type, related_entity_type, related_entity_id } = req.body;

        if (!user_id || !title || !message || !type) {
            return res.status(400).json({
                message: 'user_id, title, message, and type are required'
            });
        }

        // Check if should send based on user preferences
        const shouldSend = await NotificationPreference.shouldSendNotification(user_id, type);
        if (!shouldSend) {
            return res.json({
                success: true,
                message: 'Notification not sent due to user preferences',
                sent: false
            });
        }

        const notification = await Notification.create({
            user_id,
            title,
            message,
            type,
            related_entity_type,
            related_entity_id
        });

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            message: 'Failed to create notification',
            error: error.message
        });
    }
};

exports.createBulkNotifications = async (req, res) => {
    try {
        const { notifications } = req.body;

        if (!notifications || !Array.isArray(notifications)) {
            return res.status(400).json({
                message: 'notifications array is required'
            });
        }

        // Filter notifications based on user preferences
        const filteredNotifications = [];
        for (const notif of notifications) {
            const shouldSend = await NotificationPreference.shouldSendNotification(
                notif.user_id,
                notif.type
            );
            if (shouldSend) {
                filteredNotifications.push(notif);
            }
        }

        const createdNotifications = await Notification.createBulk(filteredNotifications);

        res.status(201).json({
            success: true,
            message: 'Bulk notifications created successfully',
            created: createdNotifications.length,
            total_requested: notifications.length,
            filtered_out: notifications.length - filteredNotifications.length,
            notifications: createdNotifications
        });
    } catch (error) {
        console.error('Create bulk notifications error:', error);
        res.status(500).json({
            message: 'Failed to create bulk notifications',
            error: error.message
        });
    }
};