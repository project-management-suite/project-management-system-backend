// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const {
  getUsers,
  updateUserRole,
  deleteUser,
  deleteUserByEmail,
  getDashboardStats,
  cleanupPendingData
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

/**
 * @openapi
 * /api/admin/users/by-email/{email}:
 *   delete:
 *     tags: [Admin - Testing]
 *     summary: Delete user by email (Development/Test only)
 *     description: Delete user account by email address. Only available in non-production environments for testing purposes.
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Not available in production or forbidden
 *       404:
 *         description: User not found
 */
router.delete('/users/by-email/:email', deleteUserByEmail);

/**
 * @openapi
 * /api/admin/cleanup-pending-data:
 *   post:
 *     tags: [Admin - Testing]
 *     summary: Cleanup pending registrations and OTPs (Development/Test only)
 *     description: Removes all pending registrations and OTPs from database. Only available in non-production environments.
 *     responses:
 *       200:
 *         description: Cleanup completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 expired_otps:
 *                   type: integer
 *                 pending_registrations:
 *                   type: integer
 *                 all_otps:
 *                   type: integer
 *       403:
 *         description: Not available in production or forbidden
 */
router.post('/cleanup-pending-data', cleanupPendingData);

module.exports = router;
