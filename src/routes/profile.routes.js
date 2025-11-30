// src/routes/profile.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const profileController = require('../controllers/profile.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 profile:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     profile_photo_url:
 *                       type: string
 *                       nullable: true
 *                     profile_photo_uploaded_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 */
router.get('/', profileController.getProfile);

/**
 * @openapi
 * /api/profile/{userId}:
 *   get:
 *     tags: [Profile]
 *     summary: Get user profile by ID (Admin only or own profile)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Profile not found
 */
router.get('/:userId', profileController.getProfile);

/**
 * @openapi
 * /api/profile/photo/upload:
 *   post:
 *     tags: [Profile]
 *     summary: Upload profile photo
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo file (JPEG, PNG, GIF, WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Profile photo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 profile:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     profile_photo_url:
 *                       type: string
 *                     profile_photo_uploaded_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: No file provided or invalid file type
 *       500:
 *         description: Upload failed
 */
router.post('/photo/upload',
    profileController.uploadMiddleware,
    profileController.uploadProfilePhoto
);

/**
 * @openapi
 * /api/profile/photo/update:
 *   put:
 *     tags: [Profile]
 *     summary: Update profile photo (replace existing)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *                 description: New profile photo file
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
 *       400:
 *         description: No file provided or invalid file type
 *       500:
 *         description: Update failed
 */
router.put('/photo/update',
    profileController.uploadMiddleware,
    profileController.updateProfilePhoto
);

/**
 * @openapi
 * /api/profile/photo/remove:
 *   delete:
 *     tags: [Profile]
 *     summary: Remove profile photo
 *     responses:
 *       200:
 *         description: Profile photo removed successfully
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
 *         description: No profile photo to remove
 *       500:
 *         description: Remove failed
 */
router.delete('/photo/remove', profileController.removeProfilePhoto);

/**
 * @openapi
 * /api/profile/photo/history:
 *   get:
 *     tags: [Profile]
 *     summary: Get profile photo history
 *     responses:
 *       200:
 *         description: Photo history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 photos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       photo_id:
 *                         type: string
 *                       file_name:
 *                         type: string
 *                       file_url:
 *                         type: string
 *                       file_size:
 *                         type: integer
 *                       mime_type:
 *                         type: string
 *                       is_current:
 *                         type: boolean
 *                       uploaded_at:
 *                         type: string
 *                         format: date-time
 */
router.get('/photo/history', profileController.getPhotoHistory);

/**
 * @openapi
 * /api/profile/admin/cleanup-photos:
 *   post:
 *     tags: [Profile]
 *     summary: Cleanup old profile photos (Admin only)
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Cleanup failed
 */
router.post('/admin/cleanup-photos',
    authorizeRoles('ADMIN'),
    profileController.cleanupOldPhotos
);

/**
 * @openapi
 * /api/profile/admin/cleanup-sample-photos:
 *   post:
 *     tags: [Profile - Testing]
 *     summary: Cleanup ALL sample profile photos from storage (Admin only, Development/Test only)
 *     description: Removes all profile photos from Supabase storage and clears database references. Only available in non-production environments.
 *     responses:
 *       200:
 *         description: Sample photos cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 removed:
 *                   type: integer
 *       403:
 *         description: Admin access required or not available in production
 *       500:
 *         description: Cleanup failed
 */
router.post('/admin/cleanup-sample-photos',
    authorizeRoles('ADMIN'),
    profileController.cleanupSamplePhotos
);

module.exports = router;