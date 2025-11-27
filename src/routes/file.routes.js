// src/routes/file.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

/**
 * @openapi
 * /api/files:
 *   get:
 *     tags: [Files]
 *     summary: List files
 *     responses:
 *       200:
 *         description: File list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/FileMeta' }
 */
router.get('/', (req, res) => res.json([]));

/**
 * @openapi
 * /api/files/{fileId}:
 *   get:
 *     tags: [Files]
 *     summary: Get file metadata
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
 *             schema: { $ref: '#/components/schemas/FileMeta' }
 *       404:
 *         description: Not found
 */
router.get('/:fileId', (req, res) => res.json({}));

module.exports = router;
