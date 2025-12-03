// src/routes/auth.routes.js
const router = require('express').Router();
const {
    register,
    login,
    verifyOTP,
    resendOTP,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    changePassword,
    logout,
    getLastOTPForTesting,
    requestAccountDeletion,
    resendAccountDeletionOTP,
    confirmAccountDeletion
} = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user (sends OTP to email)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthRegisterInput' }
 *     responses:
 *       200:
 *         description: OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Email already in use / validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register', register);

/**
 * @openapi
 * /api/auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP and complete registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       201:
 *         description: Email verified and account created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/verify-otp', verifyOTP);

/**
 * @openapi
 * /api/auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend OTP to email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: New OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: No pending registration found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/resend-otp', resendOTP);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthLoginInput' }
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401:
 *         description: Invalid credentials or email not verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset (sends OTP to email)
 *     description: Initiates password reset process by sending a 6-digit OTP to the user's registered email address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's registered email address
 *           example:
 *             email: "john@example.com"
 *     responses:
 *       200:
 *         description: Password reset OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset OTP sent to your email"
 *                 email:
 *                   type: string
 *       400:
 *         description: Email not found or validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Failed to send reset email
 */
router.post('/forgot-password', forgotPassword);

/**
 * @openapi
 * /api/auth/verify-reset-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify password reset OTP
 *     description: Verifies the password reset OTP and returns a temporary reset token for password change.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *           example:
 *             email: "john@example.com"
 *             otp: "123456"
 *     responses:
 *       200:
 *         description: Reset OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 resetToken:
 *                   type: string
 *                   description: Temporary token for password reset (valid for 15 minutes)
 *                 expiresIn:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/verify-reset-otp', verifyResetOTP);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with verified token
 *     description: Resets user password using the temporary reset token from OTP verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resetToken, newPassword]
 *             properties:
 *               resetToken:
 *                 type: string
 *                 description: Temporary reset token from verify-reset-otp
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password for the account
 *           example:
 *             resetToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             newPassword: "mynewsecurepassword"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                 - $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/reset-password', resetPassword);

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password for authenticated user
 *     description: Allows authenticated users to change their password by providing current and new passwords.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: User's current password for verification
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password to set
 *           example:
 *             currentPassword: "oldpassword123"
 *             newPassword: "newpassword456"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: New JWT token for continued session
 *       400:
 *         description: Invalid current password or validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/change-password', authenticate, changePassword);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: Logs out the authenticated user. With JWT tokens, this is primarily for client-side cleanup.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/logout', authenticate, logout);

/**
 * @openapi
 * /api/auth/delete-account/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request account deletion (sends OTP to email)
 *     description: Initiates account deletion process by sending a 6-digit OTP to the user's email. This is a permanent action that will delete all user data.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deletion OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Failed to send OTP
 */
router.post('/delete-account/request', authenticate, requestAccountDeletion);

/**
 * @openapi
 * /api/auth/delete-account/resend:
 *   post:
 *     tags: [Auth]
 *     summary: Resend account deletion OTP
 *     description: Resends the existing account deletion OTP to user's email. Sends the same OTP if still valid, or generates a new one if expired.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Failed to resend OTP
 */
router.post('/delete-account/resend', authenticate, resendAccountDeletionOTP);

/**
 * @openapi
 * /api/auth/delete-account/confirm:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm account deletion with OTP
 *     description: Permanently deletes the user account after verifying the OTP. This action cannot be undone. All user data including projects, tasks, and files will be removed due to CASCADE deletion.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *           example:
 *             otp: "123456"
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error during account deletion
 */
router.post('/delete-account/confirm', authenticate, confirmAccountDeletion);

/**
 * @openapi
 * /api/auth/test/last-otp:
 *   get:
 *     tags: [Auth - Testing]
 *     summary: Get last generated OTP (Development/Test only)
 *     description: Retrieves the last generated OTP for testing purposes. Only available in non-production environments.
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to get OTP for
 *     responses:
 *       200:
 *         description: Last generated OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: [registration, password_reset, from_database]
 *                 email:
 *                   type: string
 *                 otp:
 *                   type: string
 *                 generated_at:
 *                   type: string
 *                 expires_at:
 *                   type: string
 *                 valid_for_seconds:
 *                   type: integer
 *       400:
 *         description: No OTP found or expired
 *       403:
 *         description: Not available in production
 */

/**
 * @openapi
 * /api/auth/test/last-otp:
 *   get:
 *     tags: [Auth - Testing]
 *     summary: Get last generated OTP (Development/Test only)
 *     description: Retrieves the last generated OTP for testing purposes. Only available in non-production environments.
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to get OTP for
 *     responses:
 *       200:
 *         description: Last generated OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                 otp:
 *                   type: string
 *                 generated_at:
 *                   type: string
 *                 expires_at:
 *                   type: string
 *                 valid_for_seconds:
 *                   type: integer
 *       400:
 *         description: No OTP found or expired
 *       403:
 *         description: Not available in production
 */
router.get('/test/last-otp', getLastOTPForTesting);

module.exports = router;
