// src/routes/milestone.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const {
    createMilestone,
    getMilestones,
    getProjectMilestones,
    getMilestone,
    updateMilestone,
    deleteMilestone,
    updateMilestoneStatus,
    updateMilestoneProgress,
    addTaskToMilestone,
    removeTaskFromMilestone,
    getMilestoneTasks,
    getMilestoneProgress,
    getProjectMilestoneStats,
    getUpcomingMilestones
} = require('../controllers/milestone.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/milestones:
 *   get:
 *     tags: [Milestones]
 *     summary: Get all milestones
 *     responses:
 *       200:
 *         description: List of milestones
 */
router.get('/', getMilestones);

/**
 * @openapi
 * /api/milestones:
 *   post:
 *     tags: [Milestones]
 *     summary: Create a new milestone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project_id, milestone_name]
 *             properties:
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               milestone_name:
 *                 type: string
 *               description:
 *                 type: string
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Milestone created
 */
router.post('/', authorizeRoles('manager', 'admin'), createMilestone);

/**
 * @openapi
 * /api/milestones/project/{projectId}:
 *   get:
 *     tags: [Milestones]
 *     summary: Get milestones for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project milestones
 */
router.get('/project/:projectId', getProjectMilestones);

/**
 * @openapi
 * /api/milestones/project/{projectId}/stats:
 *   get:
 *     tags: [Milestones]
 *     summary: Get milestone statistics for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project milestone statistics
 */
router.get('/project/:projectId/stats', getProjectMilestoneStats);

/**
 * @openapi
 * /api/milestones/upcoming:
 *   get:
 *     tags: [Milestones]
 *     summary: Get upcoming milestones (due within 30 days)
 *     responses:
 *       200:
 *         description: List of upcoming milestones
 */
router.get('/upcoming', getUpcomingMilestones);

/**
 * @openapi
 * /api/milestones/{milestoneId}:
 *   get:
 *     tags: [Milestones]
 *     summary: Get milestone by ID
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Milestone details
 *       404:
 *         description: Milestone not found
 */
router.get('/:milestoneId', getMilestone);

/**
 * @openapi
 * /api/milestones/{milestoneId}:
 *   put:
 *     tags: [Milestones]
 *     summary: Update milestone
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               milestone_name:
 *                 type: string
 *               description:
 *                 type: string
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Milestone updated
 */
router.put('/:milestoneId', authorizeRoles('manager', 'admin'), updateMilestone);

/**
 * @openapi
 * /api/milestones/{milestoneId}:
 *   delete:
 *     tags: [Milestones]
 *     summary: Delete milestone
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Milestone deleted
 */
router.delete('/:milestoneId', authorizeRoles('manager', 'admin'), deleteMilestone);

/**
 * @openapi
 * /api/milestones/{milestoneId}/status:
 *   patch:
 *     tags: [Milestones]
 *     summary: Update milestone status
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *               completion_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:milestoneId/status', authorizeRoles('manager', 'admin'), updateMilestoneStatus);

/**
 * @openapi
 * /api/milestones/{milestoneId}/progress:
 *   patch:
 *     tags: [Milestones]
 *     summary: Update milestone progress
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [progress_percentage]
 *             properties:
 *               progress_percentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Progress updated
 */
router.patch('/:milestoneId/progress', authorizeRoles('manager', 'admin'), updateMilestoneProgress);

/**
 * @openapi
 * /api/milestones/{milestoneId}/tasks:
 *   get:
 *     tags: [Milestones]
 *     summary: Get tasks associated with milestone
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Milestone tasks
 */
router.get('/:milestoneId/tasks', getMilestoneTasks);

/**
 * @openapi
 * /api/milestones/{milestoneId}/tasks:
 *   post:
 *     tags: [Milestones]
 *     summary: Add task to milestone
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Task added to milestone
 */
router.post('/:milestoneId/tasks', authorizeRoles('manager', 'admin'), addTaskToMilestone);

/**
 * @openapi
 * /api/milestones/{milestoneId}/tasks/{taskId}:
 *   delete:
 *     tags: [Milestones]
 *     summary: Remove task from milestone
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task removed from milestone
 */
router.delete('/:milestoneId/tasks/:taskId', authorizeRoles('manager', 'admin'), removeTaskFromMilestone);

/**
 * @openapi
 * /api/milestones/{milestoneId}/progress/calculate:
 *   get:
 *     tags: [Milestones]
 *     summary: Calculate milestone progress based on associated tasks
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calculated progress
 */
router.get('/:milestoneId/progress/calculate', getMilestoneProgress);

module.exports = router;