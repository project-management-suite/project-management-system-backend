// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const {
  getUsers,
  updateUserRole,
  deleteUser,
  getDashboardStats
} = require('../controllers/admin.controller');

router.use(authenticate);
router.use(authorizeRoles('admin'));

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard statistics
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                 projects:
 *                   type: object
 *                 tasks:
 *                   type: object
 *       403:
 *         description: Forbidden
 */
router.get('/dashboard', getDashboardStats);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (admin only)
 *     responses:
 *       200:
 *         description: User list
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
 *                         enum: [ADMIN, MANAGER, DEVELOPER]
 *       403:
 *         description: Forbidden
 */
router.get('/users', getUsers);

/**
 * @openapi
 * /api/admin/users/{userId}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user role
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, DEVELOPER]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid role
 *       403:
 *         description: Forbidden
 */
router.patch('/users/:userId/role', updateUserRole);

/**
 * @openapi
 * /api/admin/users/{userId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete('/users/:userId', deleteUser);

module.exports = router;
