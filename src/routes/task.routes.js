// src/routes/task.routes.js
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { createTask, updateTask } = require('../controllers/task.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/tasks/project/{projectId}:
 *   post:
 *     tags: [Tasks]
 *     summary: Create task in project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateTaskInput' }
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       404:
 *         description: Project not found
 */
router.post('/project/:projectId', createTask);

/**
 * @openapi
 * /api/tasks/{taskId}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateTaskInput' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       404:
 *         description: Task not found
 */
router.patch('/:taskId', updateTask);

module.exports = router;
