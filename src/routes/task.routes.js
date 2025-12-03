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
    bulkDeleteTasks,
    getTaskSubtasks,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    getTaskWorkLogs,
    createWorkLog,
    getTaskEstimates,
    createTaskEstimate
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
 *   put:
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
router.put('/:taskId', updateTask);

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
 *           example:
 *             tasks:
 *               - title: "Setup Development Environment"
 *                 description: "Install all required dependencies and tools"
 *                 start_date: "2025-12-01"
 *                 end_date: "2025-12-03"
 *               - title: "Design Database Schema"
 *                 description: "Create ERD and define all database tables"
 *                 start_date: "2025-12-02"
 *                 end_date: "2025-12-06"
 *     responses:
 *       201:
 *         description: Bulk task creation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bulk task creation completed"
 *                 total:
 *                   type: integer
 *                   example: 2
 *                 successful:
 *                   type: integer
 *                   example: 2
 *                 failed:
 *                   type: integer
 *                   example: 0
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
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
 *           example:
 *             updates:
 *               - task_id: "task-uuid-001"
 *                 status: "IN_PROGRESS"
 *                 description: "Updated: Development environment setup in progress"
 *               - task_id: "task-uuid-002" 
 *                 status: "COMPLETED"
 *                 description: "Updated: Database design completed"
 *     responses:
 *       200:
 *         description: Bulk task update completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bulk task update completed"
 *                 total:
 *                   type: integer
 *                   example: 2
 *                 successful:
 *                   type: integer
 *                   example: 2
 *                 failed:
 *                   type: integer
 *                   example: 0
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
 *           example:
 *             task_ids:
 *               - "task-uuid-001"
 *               - "task-uuid-002"
 *               - "task-uuid-003"
 *     responses:
 *       200:
 *         description: Bulk task deletion completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bulk task deletion completed"
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 successful:
 *                   type: integer
 *                   example: 3
 *                 failed:
 *                   type: integer
 *                   example: 0
 *       400:
 *         description: Validation errors
 *       403:
 *         description: Permission denied
 */
router.delete('/bulk/delete', bulkDeleteTasks);

// Subtasks Routes

/**
 * @openapi
 * /api/tasks/{taskId}/subtasks:
 *   get:
 *     tags: [Tasks - Subtasks]
 *     summary: Get all subtasks for a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of subtasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subtasks:
 *                   type: array
 *       404:
 *         description: Task not found
 */
router.get('/:taskId/subtasks', getTaskSubtasks);

/**
 * @openapi
 * /api/tasks/{taskId}/subtasks:
 *   post:
 *     tags: [Tasks - Subtasks]
 *     summary: Create a subtask for a task (all authenticated users)
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
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               estimated_hours:
 *                 type: number
 *               assignee_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL, URGENT]
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Subtask created
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.post('/:taskId/subtasks', createSubtask);

/**
 * @openapi
 * /api/tasks/subtasks/{subtaskId}:
 *   put:
 *     tags: [Tasks - Subtasks]
 *     summary: Update a subtask (all authenticated users)
 *     parameters:
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               estimated_hours:
 *                 type: number
 *     responses:
 *       200:
 *         description: Subtask updated
 *       404:
 *         description: Subtask not found
 */
router.put('/subtasks/:subtaskId', updateSubtask);

/**
 * @openapi
 * /api/tasks/subtasks/{subtaskId}:
 *   delete:
 *     tags: [Tasks - Subtasks]
 *     summary: Delete a subtask (all authenticated users)
 *     parameters:
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subtask deleted successfully
 *       404:
 *         description: Subtask not found
 */
router.delete('/subtasks/:subtaskId', deleteSubtask);

/**
 * @openapi
 * /api/tasks/{taskId}/work-logs:
 *   get:
 *     tags: [Tasks - Work Logs]
 *     summary: Get all work logs for a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of work logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workLogs:
 *                   type: array
 *       404:
 *         description: Task not found
 */
router.get('/:taskId/work-logs', getTaskWorkLogs);

/**
 * @openapi
 * /api/tasks/{taskId}/estimates:
 *   get:
 *     tags: [Tasks - Estimates]
 *     summary: Get estimate history for a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of estimates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estimates:
 *                   type: array
 *       404:
 *         description: Task not found
 */
router.get('/:taskId/estimates', getTaskEstimates);

module.exports = router;
