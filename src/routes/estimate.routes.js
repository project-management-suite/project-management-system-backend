// src/routes/estimate.routes.js
const express = require('express');
const EstimateController = require('../controllers/estimate.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/estimates:
 *   post:
 *     summary: Create a new task or subtask estimate
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estimated_hours
 *             properties:
 *               estimated_hours:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 1000
 *                 description: Estimated hours for completion
 *               task_id:
 *                 type: string
 *                 format: uuid
 *                 description: Task ID (required if subtask_id not provided)
 *               subtask_id:
 *                 type: string
 *                 format: uuid
 *                 description: Subtask ID (required if task_id not provided)
 *               complexity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, VERY_HIGH]
 *                 description: Estimated complexity level
 *               confidence_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Confidence in the estimate (1-5)
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Additional notes about the estimate
 *     responses:
 *       201:
 *         description: Estimate created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    EstimateController.validationRules.createEstimate,
    EstimateController.createEstimate
);

/**
 * @swagger
 * /api/estimates/my:
 *   get:
 *     summary: Get current user's estimates
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User estimates retrieved successfully
 */
router.get('/my', EstimateController.getMyEstimates);

/**
 * @swagger
 * /api/estimates/my/accuracy:
 *   get:
 *     summary: Get current user's estimation accuracy
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User estimation accuracy retrieved successfully
 */
router.get('/my/accuracy', EstimateController.getMyEstimationAccuracy);

/**
 * @swagger
 * /api/estimates/trends:
 *   get:
 *     summary: Get estimation trends (analytics)
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by project
 *       - in: query
 *         name: estimatorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by estimator (managers/admins only)
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
 *         description: Estimation trends retrieved successfully
 */
router.get('/trends', EstimateController.getEstimationTrends);

/**
 * @swagger
 * /api/estimates/task/{taskId}:
 *   get:
 *     summary: Get estimates for a specific task
 *     tags: [Estimates]
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
 *         description: Task estimates retrieved successfully
 */
router.get('/task/:taskId', EstimateController.getTaskEstimates);

/**
 * @swagger
 * /api/estimates/task/{taskId}/summary:
 *   get:
 *     summary: Get task estimation summary (average, min, max)
 *     tags: [Estimates]
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
 *         description: Task estimation summary retrieved successfully
 */
router.get('/task/:taskId/summary', EstimateController.getTaskEstimationSummary);

/**
 * @swagger
 * /api/estimates/task/{taskId}/update-actual:
 *   put:
 *     summary: Update task estimates with actual hours (when task completed)
 *     tags: [Estimates]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actualHours
 *             properties:
 *               actualHours:
 *                 type: number
 *                 minimum: 0
 *                 description: Actual hours spent on the task
 *     responses:
 *       200:
 *         description: Task estimates updated with actual hours
 *       400:
 *         description: Validation error
 */
router.put(
    '/task/:taskId/estimate',
    authorizeRoles('MANAGER', 'ADMIN'),
    EstimateController.validationRules.updateTaskEstimate,
    EstimateController.updateTaskEstimate
);

/**
 * @swagger
 * /api/estimates/subtask/{subtaskId}:
 *   get:
 *     summary: Get estimates for a specific subtask
 *     tags: [Estimates]
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
 *         description: Subtask estimates retrieved successfully
 */
router.get('/subtask/:subtaskId', EstimateController.getSubtaskEstimates);

/**
 * @swagger
 * /api/estimates/subtask/{subtaskId}/summary:
 *   get:
 *     summary: Get subtask estimation summary (average, min, max)
 *     tags: [Estimates]
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
 *         description: Subtask estimation summary retrieved successfully
 */
router.get('/subtask/:subtaskId/summary', EstimateController.getSubtaskEstimationSummary);

/**
 * @swagger
 * /api/estimates/subtask/{subtaskId}/update-actual:
 *   put:
 *     summary: Update subtask estimates with actual hours (when subtask completed)
 *     tags: [Estimates]
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
 *               - actualHours
 *             properties:
 *               actualHours:
 *                 type: number
 *                 minimum: 0
 *                 description: Actual hours spent on the subtask
 *     responses:
 *       200:
 *         description: Subtask estimates updated with actual hours
 *       400:
 *         description: Validation error
 */
router.put(
    '/subtask/:subtaskId/estimate',
    authorizeRoles('MANAGER', 'ADMIN'),
    EstimateController.validationRules.updateSubtaskEstimate,
    EstimateController.updateSubtaskEstimate
);

/**
 * @swagger
 * /api/estimates/project/{projectId}/stats:
 *   get:
 *     summary: Get project estimation statistics
 *     tags: [Estimates]
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
 *     responses:
 *       200:
 *         description: Project estimation statistics retrieved successfully
 */
router.get('/project/:projectId/stats', EstimateController.getProjectEstimationStats);

/**
 * @swagger
 * /api/estimates/estimator/{estimatorId}:
 *   get:
 *     summary: Get estimates by estimator (managers/admins only)
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: estimatorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Estimator ID
 *     responses:
 *       200:
 *         description: Estimator estimates retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/estimator/:estimatorId', EstimateController.getEstimatorEstimates);

/**
 * @swagger
 * /api/estimates/estimator/{estimatorId}/accuracy:
 *   get:
 *     summary: Get estimation accuracy for an estimator (managers/admins only)
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: estimatorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Estimator ID
 *     responses:
 *       200:
 *         description: Estimator accuracy retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/estimator/:estimatorId/accuracy', EstimateController.getEstimationAccuracy);

/**
 * @swagger
 * /api/estimates/{estimateId}:
 *   get:
 *     summary: Get estimate by ID
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: estimateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Estimate ID
 *     responses:
 *       200:
 *         description: Estimate retrieved successfully
 *       404:
 *         description: Estimate not found
 */
router.get('/:estimateId', EstimateController.getEstimate);

/**
 * @swagger
 * /api/estimates/{estimateId}:
 *   put:
 *     summary: Update estimate
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: estimateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Estimate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estimated_hours:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 1000
 *               complexity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, VERY_HIGH]
 *               confidence_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Estimate updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Estimate not found
 */
router.put(
    '/:estimateId',
    EstimateController.validationRules.updateEstimate,
    EstimateController.updateEstimate
);

/**
 * @swagger
 * /api/estimates/{estimateId}:
 *   delete:
 *     summary: Delete estimate
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: estimateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Estimate ID
 *     responses:
 *       200:
 *         description: Estimate deleted successfully
 *       404:
 *         description: Estimate not found
 */
router.delete('/:estimateId', EstimateController.deleteEstimate);

module.exports = router;