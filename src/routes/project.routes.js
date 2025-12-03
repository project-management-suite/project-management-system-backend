// src/routes/project.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getDashboard,
  assignMembers,
  updateProjectStatus,
  updateProjectProgress,
  getProjectStatusAnalytics,
  getProjectsByStatus,
  getProjectStatusHistory,
  getProjectMembers,
  removeMember,
  updateMemberRole
} = require('../controllers/project.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: List projects
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Project' }
 */
router.get('/', getProjects);

/**
 * @openapi
 * /api/projects/dashboard:
 *   get:
 *     tags: [Projects]
 *     summary: Get dashboard metrics
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', getDashboard);

/**
 * @openapi
 * /api/projects/developers:
 *   get:
 *     tags: [Projects]
 *     summary: Get all developers (for managers to assign tasks)
 *     responses:
 *       200:
 *         description: List of developers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 */
router.get('/developers', authorizeRoles('manager', 'admin'), async (req, res) => {
  try {
    const { supabase } = require('../config/supabase');
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, email, role')
      .eq('role', 'DEVELOPER')
      .order('username', { ascending: true });

    if (error) throw error;

    res.json({ users: data || [] });
  } catch (error) {
    console.error('Get developers error:', error);
    res.status(500).json({ message: 'Failed to fetch developers', error: error.message });
  }
});

/**
 * @openapi
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create project
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateProjectInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       403: { description: Forbidden }
 */
router.post('/', authorizeRoles('manager', 'admin'), createProject);

/**
 * @openapi
 * /api/projects/{projectId}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: 
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/:projectId', getProject);

/**
 * @openapi
 * /api/projects/{projectId}:
 *   put:
 *     tags: [Projects]
 *     summary: Update project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: 
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 */
router.put('/:projectId', authorizeRoles('manager', 'admin'), updateProject);

/**
 * @openapi
 * /api/projects/{projectId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: 
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 */
router.delete('/:projectId', authorizeRoles('manager', 'admin'), deleteProject);

/**
 * @openapi
 * /api/projects/{projectId}/assign:
 *   post:
 *     tags: [Projects]
 *     summary: Assign members to a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AssignMembersInput' }
 *     responses:
 *       200:
 *         description: Members assigned
 *       404:
 *         description: Project not found
 */
router.post('/:projectId/assign', authorizeRoles('manager', 'admin'), assignMembers);

/**
 * @openapi
 * /api/projects/analytics/status:
 *   get:
 *     tags: [Projects]
 *     summary: Get project status analytics
 *     responses:
 *       200:
 *         description: Project status analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     total_projects:
 *                       type: integer
 *                     status_breakdown:
 *                       type: object
 *                     average_progress:
 *                       type: integer
 *                     overdue_projects:
 *                       type: integer
 *                     on_time_percentage:
 *                       type: integer
 */
router.get('/analytics/status', getProjectStatusAnalytics);

/**
 * @openapi
 * /api/projects/{projectId}/status-history:
 *   get:
 *     tags: [Projects]
 *     summary: Get project status change history
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project status history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 project_id:
 *                   type: string
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       changed_at:
 *                         type: string
 *                       changed_by:
 *                         type: string
 *                       notes:
 *                         type: string
 *       404:
 *         description: Project not found
 */
router.get('/:projectId/status-history', getProjectStatusHistory);

/**
 * @openapi
 * /api/projects/status/{status}:
 *   get:
 *     tags: [Projects]
 *     summary: Get projects by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED]
 *     responses:
 *       200:
 *         description: Projects with specified status
 */
router.get('/status/:status', getProjectsByStatus);

/**
 * @openapi
 * /api/projects/{projectId}/status:
 *   patch:
 *     tags: [Projects]
 *     summary: Update project status
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
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
 *                 enum: [PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED]
 *     responses:
 *       200:
 *         description: Project status updated
 */
router.patch('/:projectId/status', authorizeRoles('manager', 'admin'), updateProjectStatus);

/**
 * @openapi
 * /api/projects/{projectId}/progress:
 *   patch:
 *     tags: [Projects]
 *     summary: Update project progress
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
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
 *         description: Project progress updated
 */
router.patch('/:projectId/progress', authorizeRoles('manager', 'admin'), updateProjectProgress);

/**
 * @openapi
 * /api/projects/{projectId}/members:
 *   get:
 *     tags: [Projects]
 *     summary: Get project members
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project members list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project_id:
 *                   type: string
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       membership_id:
 *                         type: string
 *                       member_id:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [MEMBER, LEAD]
 *                       joined_at:
 *                         type: string
 *                       member:
 *                         type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 */
router.get('/:projectId/members', getProjectMembers);

/**
 * @openapi
 * /api/projects/{projectId}/members/{memberId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Remove member from project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
router.delete('/:projectId/members/:memberId', authorizeRoles('manager', 'admin'), removeMember);

/**
 * @openapi
 * /api/projects/{projectId}/members/{memberId}/role:
 *   patch:
 *     tags: [Projects]
 *     summary: Update member role in project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [MEMBER, LEAD]
 *     responses:
 *       200:
 *         description: Member role updated successfully
 */
router.patch('/:projectId/members/:memberId/role', authorizeRoles('manager', 'admin'), updateMemberRole);

module.exports = router;
