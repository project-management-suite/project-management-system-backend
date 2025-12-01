// src/routes/fileShare.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const {
    shareFile,
    shareBulkFiles,
    getSharedWithMe,
    getSharedByMe,
    getFileShares,
    checkFileAccess,
    updateSharePermission,
    removeShare,
    shareWithProjectTeam,
    getUserSharingStats,
    getSharingAnalytics,
    removeAllFileShares
} = require('../controllers/fileShare.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/file-shares:
 *   post:
 *     tags: [File Sharing]
 *     summary: Share a file with a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [file_id, shared_with_user_id]
 *             properties:
 *               file_id:
 *                 type: string
 *                 format: uuid
 *               shared_with_user_id:
 *                 type: string
 *                 format: uuid
 *               permission_level:
 *                 type: string
 *                 enum: [read, write, admin]
 *                 default: read
 *     responses:
 *       201:
 *         description: File shared successfully
 */
router.post('/', shareFile);

/**
 * @openapi
 * /api/file-shares/bulk:
 *   post:
 *     tags: [File Sharing]
 *     summary: Share multiple files with multiple users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [file_ids, user_ids]
 *             properties:
 *               file_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               permission_level:
 *                 type: string
 *                 enum: [read, write, admin]
 *                 default: read
 *     responses:
 *       201:
 *         description: Files shared successfully
 */
router.post('/bulk', shareBulkFiles);

/**
 * @openapi
 * /api/file-shares/shared-with-me:
 *   get:
 *     tags: [File Sharing]
 *     summary: Get files shared with current user
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: permission_level
 *         schema:
 *           type: string
 *           enum: [read, write, admin]
 *       - in: query
 *         name: mime_type_filter
 *         schema:
 *           type: string
 *           description: Filter by MIME type (e.g., 'image', 'application')
 *     responses:
 *       200:
 *         description: Files shared with user
 */
router.get('/shared-with-me', getSharedWithMe);

/**
 * @openapi
 * /api/file-shares/shared-by-me:
 *   get:
 *     tags: [File Sharing]
 *     summary: Get files shared by current user
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Files shared by user
 */
router.get('/shared-by-me', getSharedByMe);

/**
 * @openapi
 * /api/file-shares/stats:
 *   get:
 *     tags: [File Sharing]
 *     summary: Get user's file sharing statistics
 *     responses:
 *       200:
 *         description: User sharing statistics
 */
router.get('/stats', getUserSharingStats);

/**
 * @openapi
 * /api/file-shares/analytics:
 *   get:
 *     tags: [File Sharing]
 *     summary: Get file sharing analytics (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: File sharing analytics
 */
router.get('/analytics', authorizeRoles('manager', 'admin'), getSharingAnalytics);

/**
 * @openapi
 * /api/file-shares/file/{fileId}:
 *   get:
 *     tags: [File Sharing]
 *     summary: Get all shares for a specific file
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File shares
 */
router.get('/file/:fileId', getFileShares);

/**
 * @openapi
 * /api/file-shares/file/{fileId}/access:
 *   get:
 *     tags: [File Sharing]
 *     summary: Check current user's access to a file
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File access information
 */
router.get('/file/:fileId/access', checkFileAccess);

/**
 * @openapi
 * /api/file-shares/file/{fileId}/share-with-team:
 *   post:
 *     tags: [File Sharing]
 *     summary: Share file with entire project team
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permission_level:
 *                 type: string
 *                 enum: [read, write, admin]
 *                 default: read
 *     responses:
 *       201:
 *         description: File shared with project team
 */
router.post('/file/:fileId/share-with-team', shareWithProjectTeam);

/**
 * @openapi
 * /api/file-shares/file/{fileId}/remove-all:
 *   delete:
 *     tags: [File Sharing]
 *     summary: Remove all shares for a file (Admin/Manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: All file shares removed
 */
router.delete('/file/:fileId/remove-all', authorizeRoles('manager', 'admin'), removeAllFileShares);

/**
 * @openapi
 * /api/file-shares/{shareId}:
 *   put:
 *     tags: [File Sharing]
 *     summary: Update share permissions
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permission_level]
 *             properties:
 *               permission_level:
 *                 type: string
 *                 enum: [read, write, admin]
 *     responses:
 *       200:
 *         description: Share permissions updated
 */
router.put('/:shareId', updateSharePermission);

/**
 * @openapi
 * /api/file-shares/{shareId}:
 *   delete:
 *     tags: [File Sharing]
 *     summary: Remove file share
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: File share removed
 */
router.delete('/:shareId', removeShare);

module.exports = router;