// src/routes/project.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { createProject, getDashboard, assignMembers } = require('../controllers/project.controller');

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
router.get('/', (req, res) => {
  res.json({ projects: [] });
});

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
router.post('/', authorizeRoles('manager','admin'), createProject);

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
router.post('/:projectId/assign', authorizeRoles('manager','admin'), assignMembers);

module.exports = router;
