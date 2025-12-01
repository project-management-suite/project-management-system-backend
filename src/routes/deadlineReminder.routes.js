// src/routes/deadlineReminder.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const {
    createReminder,
    createSmartReminders,
    getUserReminders,
    getReminder,
    updateReminder,
    deleteReminder,
    getPendingReminders,
    processPendingReminders,
    getOverdueReminders,
    createEscalationReminders,
    getUserReminderStats,
    getReminderAnalytics,
    deleteTaskReminders
} = require('../controllers/deadlineReminder.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/deadline-reminders:
 *   post:
 *     tags: [Deadline Reminders]
 *     summary: Create a deadline reminder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task_id, reminder_date]
 *             properties:
 *               task_id:
 *                 type: string
 *                 format: uuid
 *               reminder_date:
 *                 type: string
 *                 format: date-time
 *               reminder_type:
 *                 type: string
 *                 enum: [email, notification, both]
 *                 default: email
 *     responses:
 *       201:
 *         description: Reminder created successfully
 */
router.post('/', createReminder);

/**
 * @openapi
 * /api/deadline-reminders/smart:
 *   post:
 *     tags: [Deadline Reminders]
 *     summary: Create smart reminders with automatic scheduling
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task_id]
 *             properties:
 *               task_id:
 *                 type: string
 *                 format: uuid
 *               reminder_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [24hours, 3days, 1week, 2weeks]
 *                 default: [24hours, 1week, 3days]
 *               custom_dates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date-time
 *               reminder_method:
 *                 type: string
 *                 enum: [email, notification, both]
 *                 default: email
 *     responses:
 *       201:
 *         description: Smart reminders created
 */
router.post('/smart', createSmartReminders);

/**
 * @openapi
 * /api/deadline-reminders:
 *   get:
 *     tags: [Deadline Reminders]
 *     summary: Get user's deadline reminders
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
 *         name: pending_only
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: User's reminders
 */
router.get('/', getUserReminders);

/**
 * @openapi
 * /api/deadline-reminders/stats:
 *   get:
 *     tags: [Deadline Reminders]
 *     summary: Get reminder statistics for current user
 *     responses:
 *       200:
 *         description: User reminder statistics
 */
router.get('/stats', getUserReminderStats);

/**
 * @openapi
 * /api/deadline-reminders/pending:
 *   get:
 *     tags: [Deadline Reminders]
 *     summary: Get pending reminders (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: batch_size
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Pending reminders
 */
router.get('/pending', authorizeRoles('manager', 'admin'), getPendingReminders);

/**
 * @openapi
 * /api/deadline-reminders/process:
 *   post:
 *     tags: [Deadline Reminders]
 *     summary: Process and send pending reminders (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Reminders processed
 */
router.post('/process', authorizeRoles('manager', 'admin'), processPendingReminders);

/**
 * @openapi
 * /api/deadline-reminders/overdue:
 *   get:
 *     tags: [Deadline Reminders]
 *     summary: Get overdue task reminders (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Overdue reminders
 */
router.get('/overdue', authorizeRoles('manager', 'admin'), getOverdueReminders);

/**
 * @openapi
 * /api/deadline-reminders/escalation:
 *   post:
 *     tags: [Deadline Reminders]
 *     summary: Create escalation reminders for overdue tasks (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task_id, manager_id]
 *             properties:
 *               task_id:
 *                 type: string
 *                 format: uuid
 *               manager_id:
 *                 type: string
 *                 format: uuid
 *               escalation_days:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 default: [1, 3, 7]
 *     responses:
 *       201:
 *         description: Escalation reminders created
 */
router.post('/escalation', authorizeRoles('manager', 'admin'), createEscalationReminders);

/**
 * @openapi
 * /api/deadline-reminders/analytics:
 *   get:
 *     tags: [Deadline Reminders]
 *     summary: Get reminder analytics (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reminder analytics data
 */
router.get('/analytics', authorizeRoles('manager', 'admin'), getReminderAnalytics);

/**
 * @openapi
 * /api/deadline-reminders/{reminderId}:
 *   get:
 *     tags: [Deadline Reminders]
 *     summary: Get reminder by ID
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reminder details
 *       404:
 *         description: Reminder not found
 */
router.get('/:reminderId', getReminder);

/**
 * @openapi
 * /api/deadline-reminders/{reminderId}:
 *   put:
 *     tags: [Deadline Reminders]
 *     summary: Update reminder
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reminder_date:
 *                 type: string
 *                 format: date-time
 *               reminder_type:
 *                 type: string
 *                 enum: [email, notification, both]
 *     responses:
 *       200:
 *         description: Reminder updated
 */
router.put('/:reminderId', updateReminder);

/**
 * @openapi
 * /api/deadline-reminders/{reminderId}:
 *   delete:
 *     tags: [Deadline Reminders]
 *     summary: Delete reminder
 *     parameters:
 *       - in: path
 *         name: reminderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reminder deleted
 */
router.delete('/:reminderId', deleteReminder);

/**
 * @openapi
 * /api/deadline-reminders/task/{taskId}:
 *   delete:
 *     tags: [Deadline Reminders]
 *     summary: Delete all reminders for a task (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task reminders deleted
 */
router.delete('/task/:taskId', authorizeRoles('manager', 'admin'), deleteTaskReminders);

module.exports = router;