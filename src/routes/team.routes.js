// src/routes/team.routes.js
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         team_id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the team
 *         team_name:
 *           type: string
 *           description: Name of the team
 *         description:
 *           type: string
 *           description: Description of the team
 *         manager_id:
 *           type: string
 *           format: uuid
 *           description: User ID of the team manager
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     TeamMember:
 *       type: object
 *       properties:
 *         team_id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         role_in_team:
 *           type: string
 *           enum: [DEVELOPER, LEAD_DEVELOPER, MANAGER]
 *         joined_at:
 *           type: string
 *           format: date-time
 *     TeamProject:
 *       type: object
 *       properties:
 *         team_id:
 *           type: string
 *           format: uuid
 *         project_id:
 *           type: string
 *           format: uuid
 *         assigned_at:
 *           type: string
 *           format: date-time
 *     TeamStats:
 *       type: object
 *       properties:
 *         totalMembers:
 *           type: integer
 *         totalProjects:
 *           type: integer
 *         totalTasks:
 *           type: integer
 *         completedTasks:
 *           type: integer
 *         pendingTasks:
 *           type: integer
 *         inProgressTasks:
 *           type: integer
 */

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Get all teams based on user role
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 teams:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *       401:
 *         description: Unauthorized
 */
router.get('/', teamController.getAllTeams);

/**
 * @swagger
 * /api/teams/dashboard:
 *   get:
 *     summary: Get team dashboard statistics (Manager/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     totalTeams:
 *                       type: integer
 *                     totalMembers:
 *                       type: integer
 *                     teamsOverview:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           teamId:
 *                             type: string
 *                           teamName:
 *                             type: string
 *                           manager:
 *                             type: string
 *                           memberCount:
 *                             type: integer
 *                           projectCount:
 *                             type: integer
 *                           totalTasks:
 *                             type: integer
 *                           completedTasks:
 *                             type: integer
 *                           productivity:
 *                             type: integer
 *       403:
 *         description: Access denied
 */
router.get('/dashboard', authorizeRoles('MANAGER', 'ADMIN'), teamController.getTeamDashboard);

/**
 * @swagger
 * /api/teams/available-users:
 *   get:
 *     summary: Get available users (developers and managers) for team assignment
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
router.get('/available-users', authorizeRoles('MANAGER', 'ADMIN'), teamController.getAvailableUsers);

/**
 * @swagger
 * /api/teams/available-developers:
 *   get:
 *     summary: Get available developers for team assignment
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available developers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 developers:
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
 */
router.get('/available-developers', authorizeRoles('MANAGER', 'ADMIN'), teamController.getAvailableDevelopers);

/**
 * @swagger
 * /api/teams/{teamId}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team not found
 */
router.get('/:teamId', teamController.getTeamById);

/**
 * @swagger
 * /api/teams/{teamId}/stats:
 *   get:
 *     summary: Get team statistics
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   $ref: '#/components/schemas/TeamStats'
 *       404:
 *         description: Team not found
 */
router.get('/:teamId/stats', teamController.getTeamStats);

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Create a new team (Manager/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team_name
 *             properties:
 *               team_name:
 *                 type: string
 *                 description: Name of the team
 *               description:
 *                 type: string
 *                 description: Description of the team
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       409:
 *         description: Team name already exists
 */
router.post('/', authorizeRoles('MANAGER', 'ADMIN'), teamController.createTeam);

/**
 * @swagger
 * /api/teams/{teamId}:
 *   put:
 *     summary: Update team (Team Manager/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               team_name:
 *                 type: string
 *                 description: Name of the team
 *               description:
 *                 type: string
 *                 description: Description of the team
 *     responses:
 *       200:
 *         description: Team updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *       404:
 *         description: Team not found
 *       403:
 *         description: Access denied
 *       409:
 *         description: Team name already exists
 */
router.put('/:teamId', teamController.updateTeam);

/**
 * @swagger
 * /api/teams/{teamId}:
 *   delete:
 *     summary: Delete team (Team Manager/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Team not found
 *       403:
 *         description: Access denied
 */
router.delete('/:teamId', teamController.deleteTeam);

/**
 * @swagger
 * /api/teams/{teamId}/members:
 *   post:
 *     summary: Add member to team (Team Manager/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
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
 *                 description: User ID to add to team
 *               roleInTeam:
 *                 type: string
 *                 enum: [DEVELOPER, LEAD_DEVELOPER]
 *                 default: DEVELOPER
 *                 description: Role in the team
 *     responses:
 *       201:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 member:
 *                   $ref: '#/components/schemas/TeamMember'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Team or user not found
 *       409:
 *         description: User already member of team
 */
router.post('/:teamId/members', teamController.addMember);

/**
 * @swagger
 * /api/teams/{teamId}/members/{userId}:
 *   delete:
 *     summary: Remove member from team (Team Manager/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to remove from team
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Team not found
 *       403:
 *         description: Access denied
 */
router.delete('/:teamId/members/:userId', teamController.removeMember);

/**
 * @swagger
 * /api/teams/{teamId}/members/{userId}/role:
 *   put:
 *     summary: Update member role in team (Team Manager/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleInTeam
 *             properties:
 *               roleInTeam:
 *                 type: string
 *                 enum: [DEVELOPER, LEAD_DEVELOPER]
 *                 description: New role in the team
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 member:
 *                   $ref: '#/components/schemas/TeamMember'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Team not found
 */
router.put('/:teamId/members/:userId/role', teamController.updateMemberRole);

/**
 * @swagger
 * /api/teams/{teamId}/projects:
 *   post:
 *     summary: Assign team to project (Team Manager/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: Project ID to assign team to
 *     responses:
 *       201:
 *         description: Team assigned to project successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 assignment:
 *                   $ref: '#/components/schemas/TeamProject'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Team or project not found
 *       409:
 *         description: Team already assigned to project
 */
router.post('/:teamId/projects', teamController.assignToProject);

/**
 * @swagger
 * /api/teams/{teamId}/projects/{projectId}:
 *   delete:
 *     summary: Remove team from project (Team Manager/Admin only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Team removed from project successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Team not found
 *       403:
 *         description: Access denied
 */
router.delete('/:teamId/projects/:projectId', teamController.removeFromProject);

module.exports = router;// Team routes fixed
