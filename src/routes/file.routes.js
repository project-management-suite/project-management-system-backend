// src/routes/file.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const fileController = require('../controllers/file.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/files:
 *   get:
 *     tags: [Files]
 *     summary: List all accessible files
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
 *         description: File list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 files:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FileMeta' }
 */
router.get('/', fileController.getAllFiles);

/**
 * @openapi
 * /api/files/upload-standalone:
 *   post:
 *     tags: [Files]
 *     summary: Upload a standalone file for sharing
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               uploaded_by_user_id:
 *                 type: string
 *                 description: ID of the user uploading the file
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: No file provided or invalid input
 *       403:
 *         description: Access denied
 */
router.post('/upload-standalone', fileController.uploadStandaloneMiddleware, fileController.uploadStandaloneFile);

/**
 * @openapi
 * /api/files/my-standalone:
 *   get:
 *     tags: [Files]
 *     summary: Get user's own standalone files
 *     responses:
 *       200:
 *         description: User's standalone files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 files:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FileMeta' }
 */
router.get('/my-standalone', fileController.getUserStandaloneFiles);

/**
 * @openapi
 * /api/files/project/{projectId}/upload:
 *   post:
 *     tags: [Files]
 *     summary: Upload files to a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               task_id:
 *                 type: string
 *                 description: Optional task ID to associate files with
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: No files provided or invalid input
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 */
router.post('/project/:project_id/upload', fileController.uploadMiddleware, fileController.uploadProjectFiles);

/**
 * @openapi
 * /api/files/project/{projectId}:
 *   get:
 *     tags: [Files]
 *     summary: Get files for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 files:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FileMeta' }
 */
router.get('/project/:project_id', fileController.getProjectFiles);

/**
 * @openapi
 * /api/files/task/{taskId}:
 *   get:
 *     tags: [Files]
 *     summary: Get files for a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 files:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FileMeta' }
 */
router.get('/task/:task_id', fileController.getTaskFiles);

/**
 * @openapi
 * /api/files/{fileId}:
 *   get:
 *     tags: [Files]
 *     summary: Get file metadata by ID
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 file: { $ref: '#/components/schemas/FileMeta' }
 *       404:
 *         description: File not found
 *       403:
 *         description: Access denied
 *   delete:
 *     tags: [Files]
 *     summary: Delete a file
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       403:
 *         description: Access denied
 */
/**
 * @openapi
 * /api/files/stats:
 *   get:
 *     tags: [Files]
 *     summary: Get file statistics (Admin/Manager only)
 *     responses:
 *       200:
 *         description: File statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total_files:
 *                       type: integer
 *                     total_size_bytes:
 *                       type: integer
 *                     average_file_size:
 *                       type: integer
 *                     most_common_type:
 *                       type: string
 */
router.get('/stats', fileController.getFileStats);

/**
 * @openapi
 * /api/files/{fileId}:
 *   get:
 *     tags: [Files]
 *     summary: Get file metadata by ID
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 file: { $ref: '#/components/schemas/FileMeta' }
 *       404:
 *         description: File not found
 *       403:
 *         description: Access denied
 *   delete:
 *     tags: [Files]
 *     summary: Delete a file
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       403:
 *         description: Access denied
 */
router.get('/:file_id', fileController.getFileById);
router.delete('/:file_id', fileController.deleteFile);

/**
 * @openapi
 * /api/files/stats:
 *   get:
 *     tags: [Files]
 *     summary: Get file statistics (Admin/Manager only)
 *     responses:
 *       200:
 *         description: File statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total_files:
 *                       type: integer
 *                     total_size_bytes:
 *                       type: integer
 *                     average_file_size:
 *                       type: integer
 *                     most_common_type:
 *                       type: string
 */
router.get('/stats', fileController.getFileStats);

module.exports = router;
