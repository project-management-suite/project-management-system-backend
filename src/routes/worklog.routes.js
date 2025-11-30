// src/routes/worklog.routes.js
const express = require('express');
const WorkLogController = require('../controllers/worklog.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/worklogs:
 *   post:
 *     summary: Create a new work log entry
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hours_logged
 *               - work_date
 *             properties:
 *               hours_logged:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 24
 *                 description: Hours worked (0.1 to 24 hours)
 *               work_date:
 *                 type: string
 *                 format: date
 *                 description: Date when work was performed
 *               task_id:
 *                 type: string
 *                 format: uuid
 *                 description: Task ID (optional if subtask_id provided)
 *               subtask_id:
 *                 type: string
 *                 format: uuid
 *                 description: Subtask ID (optional if task_id provided)
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Work description
 *               log_type:
 *                 type: string
 *                 enum: [DEVELOPMENT, TESTING, REVIEW, DOCUMENTATION, MEETING, RESEARCH, BUG_FIX, OTHER]
 *                 description: Type of work performed
 *     responses:
 *       201:
 *         description: Work log created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    WorkLogController.validationRules.createWorkLog,
    WorkLogController.createWorkLog
);

/**
 * @swagger
 * /api/worklogs/bulk:
 *   post:
 *     summary: Create multiple work log entries
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workLogs
 *             properties:
 *               workLogs:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - hours_logged
 *                     - work_date
 *                   properties:
 *                     hours_logged:
 *                       type: number
 *                       minimum: 0.1
 *                       maximum: 24
 *                     work_date:
 *                       type: string
 *                       format: date
 *                     task_id:
 *                       type: string
 *                       format: uuid
 *                     subtask_id:
 *                       type: string
 *                       format: uuid
 *                     description:
 *                       type: string
 *                     log_type:
 *                       type: string
 *                       enum: [DEVELOPMENT, TESTING, REVIEW, DOCUMENTATION, MEETING, RESEARCH, BUG_FIX, OTHER]
 *     responses:
 *       201:
 *         description: Work logs created successfully
 *       400:
 *         description: Validation error
 */
router.post(
    '/bulk',
    WorkLogController.validationRules.createBulkWorkLogs,
    WorkLogController.createBulkWorkLogs
);

/**
 * @swagger
 * /api/worklogs/my:
 *   get:
 *     summary: Get current user's work logs
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by project
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by task
 *       - in: query
 *         name: logType
 *         schema:
 *           type: string
 *           enum: [DEVELOPMENT, TESTING, REVIEW, DOCUMENTATION, MEETING, RESEARCH, BUG_FIX, OTHER]
 *         description: Filter by log type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User work logs retrieved successfully
 */
router.get('/my', WorkLogController.getUserWorkLogs);

/**
 * @swagger
 * /api/worklogs/my/stats:
 *   get:
 *     summary: Get current user's work log statistics
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: User work log statistics
 */
router.get('/my/stats', WorkLogController.getUserStats);

/**
 * @swagger
 * /api/worklogs/recent:
 *   get:
 *     summary: Get recent work logs
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of recent logs to return
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (only for managers/admins)
 *     responses:
 *       200:
 *         description: Recent work logs retrieved successfully
 */
router.get('/recent', WorkLogController.getRecentWorkLogs);

/**
 * @swagger
 * /api/worklogs/task/{taskId}:
 *   get:
 *     summary: Get work logs for a specific task
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task work logs retrieved successfully
 */
router.get('/task/:taskId', WorkLogController.getTaskWorkLogs);

/**
 * @swagger
 * /api/worklogs/subtask/{subtaskId}:
 *   get:
 *     summary: Get work logs for a specific subtask
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subtask ID
 *     responses:
 *       200:
 *         description: Subtask work logs retrieved successfully
 */
router.get('/subtask/:subtaskId', WorkLogController.getSubtaskWorkLogs);

/**
 * @swagger
 * /api/worklogs/project/{projectId}:
 *   get:
 *     summary: Get work logs for a project (managers/admins only)
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user
 *       - in: query
 *         name: logType
 *         schema:
 *           type: string
 *           enum: [DEVELOPMENT, TESTING, REVIEW, DOCUMENTATION, MEETING, RESEARCH, BUG_FIX, OTHER]
 *         description: Filter by log type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Project work logs retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get(
    '/project/:projectId',
    authorizeRoles('MANAGER', 'ADMIN'),
    WorkLogController.getProjectWorkLogs
);

/**
 * @swagger
 * /api/worklogs/project/{projectId}/stats:
 *   get:
 *     summary: Get work log statistics for a project (managers/admins only)
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Project work log statistics
 *       403:
 *         description: Access denied
 */
router.get(
    '/project/:projectId/stats',
    authorizeRoles('MANAGER', 'ADMIN'),
    WorkLogController.getProjectStats
);

/**
 * @swagger
 * /api/worklogs/{logId}:
 *   get:
 *     summary: Get work log by ID
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work log ID
 *     responses:
 *       200:
 *         description: Work log retrieved successfully
 *       404:
 *         description: Work log not found
 */
router.get('/:logId', WorkLogController.getWorkLog);

/**
 * @swagger
 * /api/worklogs/{logId}:
 *   put:
 *     summary: Update work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours_logged:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 24
 *               work_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               log_type:
 *                 type: string
 *                 enum: [DEVELOPMENT, TESTING, REVIEW, DOCUMENTATION, MEETING, RESEARCH, BUG_FIX, OTHER]
 *     responses:
 *       200:
 *         description: Work log updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Work log not found
 */
router.put(
    '/:logId',
    WorkLogController.validationRules.updateWorkLog,
    WorkLogController.updateWorkLog
);

/**
 * @swagger
 * /api/worklogs/{logId}:
 *   delete:
 *     summary: Delete work log
 *     tags: [WorkLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Work log ID
 *     responses:
 *       200:
 *         description: Work log deleted successfully
 *       404:
 *         description: Work log not found
 */
router.delete('/:logId', WorkLogController.deleteWorkLog);

module.exports = router;