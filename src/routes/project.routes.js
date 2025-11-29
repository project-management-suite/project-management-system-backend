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
  assignMembers
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

module.exports = router;
