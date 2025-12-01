// src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const {
    getNotifications,
    getNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteMultipleNotifications,
    getNotificationStats,
    getNotificationPreferences,
    updateNotificationPreferences,
    createNotification,
    createBulkNotifications
} = require('../controllers/notification.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user notifications
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: User notifications
 */
router.get('/', getNotifications);

/**
 * @openapi
 * /api/notifications/stats:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification statistics
 *     responses:
 *       200:
 *         description: Notification statistics
 */
router.get('/stats', getNotificationStats);

/**
 * @openapi
 * /api/notifications/preferences:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification preferences
 *     responses:
 *       200:
 *         description: User notification preferences
 */
router.get('/preferences', getNotificationPreferences);

/**
 * @openapi
 * /api/notifications/preferences:
 *   put:
 *     tags: [Notifications]
 *     summary: Update notification preferences
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_notifications:
 *                 type: boolean
 *               task_assignments:
 *                 type: boolean
 *               deadline_reminders:
 *                 type: boolean
 *               status_updates:
 *                 type: boolean
 *               weekly_digest:
 *                 type: boolean
 *               milestone_updates:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put('/preferences', updateNotificationPreferences);

/**
 * @openapi
 * /api/notifications/mark-all-read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/mark-all-read', markAllNotificationsAsRead);

/**
 * @openapi
 * /api/notifications/bulk-delete:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete multiple notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notification_ids]
 *             properties:
 *               notification_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Notifications deleted
 */
router.delete('/bulk-delete', deleteMultipleNotifications);

/**
 * @openapi
 * /api/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create notification (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, title, message, type]
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TASK_ASSIGNED, TASK_COMPLETED, DEADLINE_REMINDER, PROJECT_UPDATED, MILESTONE_COMPLETED, SYSTEM]
 *               related_entity_type:
 *                 type: string
 *                 enum: [task, project, milestone]
 *               related_entity_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/', authorizeRoles('manager', 'admin'), createNotification);

/**
 * @openapi
 * /api/notifications/bulk:
 *   post:
 *     tags: [Notifications]
 *     summary: Create bulk notifications (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notifications]
 *             properties:
 *               notifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [user_id, title, message, type]
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     message:
 *                       type: string
 *                     type:
 *                       type: string
 *                     related_entity_type:
 *                       type: string
 *                     related_entity_id:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       201:
 *         description: Bulk notifications created
 */
router.post('/bulk', authorizeRoles('manager', 'admin'), createBulkNotifications);

/**
 * @openapi
 * /api/notifications/{notificationId}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification by ID
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification details
 *       404:
 *         description: Notification not found
 */
router.get('/:notificationId', getNotification);

/**
 * @openapi
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:notificationId/read', markNotificationAsRead);

/**
 * @openapi
 * /api/notifications/{notificationId}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:notificationId', deleteNotification);

module.exports = router;