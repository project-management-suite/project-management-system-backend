// src/routes/task.routes.js
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const {
    createTask,
    updateTask,
    getTask,
    getTasks,
    deleteTask,
    assignDeveloper,
    unassignDeveloper
} = require('../controllers/task.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get tasks for current user
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 */
router.get('/', getTasks);

/**
 * @openapi
 * /api/tasks/project/{projectId}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get tasks for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of project tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 */
router.get('/project/:projectId', getTasks);

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
router.post('/project/:projectId', authorizeRoles('manager', 'admin'), createTask);

/**
 * @openapi
 * /api/tasks/{taskId}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       404:
 *         description: Task not found
 */
router.get('/:taskId', getTask);

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

/**
 * @openapi
 * /api/tasks/{taskId}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 */
router.delete('/:taskId', authorizeRoles('manager', 'admin'), deleteTask);

/**
 * @openapi
 * /api/tasks/{taskId}/assign:
 *   post:
 *     tags: [Tasks]
 *     summary: Assign developer to task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - developer_id
 *             properties:
 *               developer_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Developer assigned successfully
 *       400:
 *         description: Developer already assigned
 */
router.post('/:taskId/assign', authorizeRoles('manager', 'admin'), assignDeveloper);

/**
 * @openapi
 * /api/tasks/{taskId}/unassign/{developerId}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Unassign developer from task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: developerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Developer unassigned successfully
 *       404:
 *         description: Assignment not found
 */
router.delete('/:taskId/unassign/:developerId', authorizeRoles('manager', 'admin'), unassignDeveloper);

module.exports = router;
