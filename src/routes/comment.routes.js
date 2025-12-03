// src/routes/comment.routes.js
const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {
    getTaskComments,
    createComment,
    updateComment,
    deleteComment
} = require('../controllers/comment.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/comments/task/{taskId}:
 *   get:
 *     tags: [Comments]
 *     summary: Get all comments for a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of task comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 */
router.get('/task/:taskId', getTaskComments);

/**
 * @openapi
 * /api/comments/task/{taskId}:
 *   post:
 *     tags: [Comments]
 *     summary: Create a comment on a task
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment_text
 *             properties:
 *               comment_text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 */
router.post('/task/:taskId', createComment);

/**
 * @openapi
 * /api/comments/{commentId}:
 *   patch:
 *     tags: [Comments]
 *     summary: Update a comment
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment_text
 *             properties:
 *               comment_text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 */
router.patch('/:commentId', updateComment);

/**
 * @openapi
 * /api/comments/{commentId}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 */
router.delete('/:commentId', deleteComment);

module.exports = router;
