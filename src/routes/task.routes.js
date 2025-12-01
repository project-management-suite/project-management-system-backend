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
    unassignDeveloper,
    bulkCreateTasks,
    bulkUpdateTasks,
    bulkDeleteTasks
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
router.post('/project/:projectId', createTask);

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
router.delete('/:taskId', deleteTask);

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

/**
 * @openapi
 * /api/projects/{projectId}/tasks/bulk/create:
 *   post:
 *     tags: [Tasks]
 *     summary: Create multiple tasks in bulk
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *     responses:
 *       201:
 *         description: Bulk task creation completed
 *       400:
 *         description: Validation errors
 *       403:
 *         description: Permission denied
 */
router.post('/project/:projectId/bulk/create', bulkCreateTasks);

/**
 * @openapi
 * /api/tasks/bulk/update:
 *   put:
 *     tags: [Tasks]
 *     summary: Update multiple tasks in bulk
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     task_id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *     responses:
 *       200:
 *         description: Bulk task update completed
 *       400:
 *         description: Validation errors
 *       403:
 *         description: Permission denied
 */
router.put('/bulk/update', bulkUpdateTasks);

/**
 * @openapi
 * /api/tasks/bulk/delete:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete multiple tasks in bulk
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of task IDs to delete
 *     responses:
 *       200:
 *         description: Bulk task deletion completed
 *       400:
 *         description: Validation errors
 *       403:
 *         description: Permission denied
 */
router.delete('/bulk/delete', bulkDeleteTasks);

module.exports = router;
