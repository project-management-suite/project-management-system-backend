// src/routes/subtask.routes.js
const express = require('express');
const SubtaskController = require('../controllers/subtask.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/subtasks:
 *   post:
 *     summary: Create a new subtask
 *     tags: [Subtasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - task_id
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 description: Subtask title
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Subtask description
 *               task_id:
 *                 type: string
 *                 format: uuid
 *                 description: Parent task ID
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 description: Subtask priority
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED]
 *                 default: TODO
 *                 description: Subtask status
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 description: Subtask due date
 *               estimated_hours:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 1000
 *                 description: Estimated hours for completion
 *     responses:
 *       201:
 *         description: Subtask created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    SubtaskController.validationRules.createSubtask,
    SubtaskController.createSubtask
);

/**
 * @swagger
 * /api/subtasks/my:
 *   get:
 *     summary: Get current user's assigned subtasks
 *     tags: [Subtasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: User subtasks retrieved successfully
 */
router.get('/my', SubtaskController.getUserSubtasks);

/**
 * @swagger
 * /api/subtasks/task/{taskId}:
 *   get:
 *     summary: Get subtasks for a specific task
 *     tags: [Subtasks]
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
 *         description: Task subtasks retrieved successfully
 */
router.get('/task/:taskId', SubtaskController.getTaskSubtasks);

/**
 * @swagger
 * /api/subtasks/project/{projectId}:
 *   get:
 *     summary: Get subtasks for a project
 *     tags: [Subtasks]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by priority
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned user
 *     responses:
 *       200:
 *         description: Project subtasks retrieved successfully
 */
router.get('/project/:projectId', SubtaskController.getProjectSubtasks);

/**
 * @swagger
 * /api/subtasks/{subtaskId}:
 *   get:
 *     summary: Get subtask by ID
 *     tags: [Subtasks]
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
 *         description: Subtask retrieved successfully
 *       404:
 *         description: Subtask not found
 */
router.get('/:subtaskId', SubtaskController.getSubtask);

/**
 * @swagger
 * /api/subtasks/{subtaskId}:
 *   put:
 *     summary: Update subtask
 *     tags: [Subtasks]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED]
 *               due_date:
 *                 type: string
 *                 format: date-time
 *               estimated_hours:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 1000
 *               actual_hours:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10000
 *     responses:
 *       200:
 *         description: Subtask updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Subtask not found
 */
router.put(
    '/:subtaskId',
    SubtaskController.validationRules.updateSubtask,
    SubtaskController.updateSubtask
);

/**
 * @swagger
 * /api/subtasks/{subtaskId}:
 *   delete:
 *     summary: Delete subtask
 *     tags: [Subtasks]
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
 *         description: Subtask deleted successfully
 *       404:
 *         description: Subtask not found
 */
router.delete('/:subtaskId', SubtaskController.deleteSubtask);

/**
 * @swagger
 * /api/subtasks/{subtaskId}/assign:
 *   post:
 *     summary: Assign user to subtask
 *     tags: [Subtasks]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID to assign
 *     responses:
 *       200:
 *         description: User assigned to subtask successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Subtask not found
 */
router.post(
    '/:subtaskId/assign',
    SubtaskController.validationRules.assignUser,
    SubtaskController.assignUser
);

/**
 * @swagger
 * /api/subtasks/{subtaskId}/unassign:
 *   post:
 *     summary: Unassign user from subtask
 *     tags: [Subtasks]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID to unassign
 *     responses:
 *       200:
 *         description: User unassigned from subtask successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Subtask not found
 */
router.post(
    '/:subtaskId/unassign/:userId',
    SubtaskController.unassignUser
);

/**
 * @swagger
 * /api/subtasks/{subtaskId}/estimate:
 *   post:
 *     summary: Add estimate to subtask
 *     tags: [Subtasks]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estimatedHours
 *             properties:
 *               estimatedHours:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 1000
 *                 description: Estimated hours
 *               complexity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, VERY_HIGH]
 *                 description: Complexity level
 *               confidenceLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Confidence in estimate (1-5)
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Estimate notes
 *     responses:
 *       200:
 *         description: Estimate added to subtask successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Subtask not found
 */
router.post(
    '/:subtaskId/estimate',
    SubtaskController.validationRules.addEstimate,
    SubtaskController.addEstimate
);

/**
 * @swagger
 * /api/subtasks/{subtaskId}/stats:
 *   get:
 *     summary: Get subtask statistics
 *     tags: [Subtasks]
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
 *         description: Subtask statistics retrieved successfully
 *       404:
 *         description: Subtask not found
 */
router.get('/:subtaskId/stats', SubtaskController.getSubtaskStats);

module.exports = router;