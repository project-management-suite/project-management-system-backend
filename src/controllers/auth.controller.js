// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const OTPModel = require('../models/otp.model');
const { generateOTP, sendOTPEmail, sendPasswordResetEmail, sendPasswordChangeConfirmationEmail } = require('../utils/mailer');

const signToken = (user) => {
  return jwt.sign(
    {
      id: user.user_id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user and send OTP verification email
 *     description: Initiates user registration by sending a 6-digit OTP to the provided email. User data is stored temporarily until email verification is completed.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegisterInput'
 *           example:
 *             username: "john_doe"
 *             email: "john@example.com"
 *             password: "securepassword123"
 *             role: "DEVELOPER"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPRegisterResponse'
 *       400:
 *         description: Email already in use or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to send verification email or server error
 */

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    await OTPModel.storeOTP(email, otp);

    // Send OTP email
    try {
      // Development/Testing mode: Enhanced OTP logging
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 TESTING MODE - OTP GENERATED');
        console.log('='.repeat(60));
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 OTP: ${otp}`);
        console.log(`⏰ Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()}`);
        console.log(`🔄 Use this OTP to verify: POST /api/auth/verify-otp`);
        console.log('='.repeat(60) + '\n');

        // Store OTP in a way the seed script can access it (for testing only)
        global.lastGeneratedOTP = { email, otp, timestamp: Date.now() };

        try {
          await sendOTPEmail(email, otp, username);
          console.log(`✅ OTP email sent successfully to ${email}`);
        } catch (emailError) {
          console.warn(`⚠️  Email service failed, but OTP is available above for testing:`, emailError.message);
          console.warn(`   Use OTP: ${otp} for email: ${email}`);
        }
      } else {
        await sendOTPEmail(email, otp, username);
      }
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
        return res.status(500).json({ message: 'Failed to send verification email' });
      }
    }

    // Store user data temporarily (without creating the user yet)
    // In a real app, you might store this in Redis or a temporary table
    // For now, we'll use the OTP table to store the user data
    await OTPModel.storePendingUser(email, { username, password, role });

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete user registration
 *     description: Verifies the 6-digit OTP sent to user's email and completes the registration process. Returns a JWT token for immediate login.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerifyInput'
 *           example:
 *             email: "john@example.com"
 *             otp: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully, user created and logged in
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Email verified and account created successfully"
 *                 - $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid OTP, expired OTP, or missing registration data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during user creation
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Verify OTP
    const otpResult = await OTPModel.verifyOTP(email, otp);
    if (!otpResult.valid) {
      return res.status(400).json({ message: otpResult.message });
    }

    // Get pending user data
    const pendingUser = await OTPModel.getPendingUser(email);
    if (!pendingUser) {
      return res.status(400).json({ message: 'No pending registration found for this email' });
    }

    // Create the user now that email is verified
    const user = await User.create({
      username: pendingUser.username,
      email: email,
      password: pendingUser.password,
      role: pendingUser.role,
      email_verified: true
    });

    // Clean up pending user data
    await OTPModel.deletePendingUser(email);

    const token = signToken(user);

    res.status(201).json({
      message: 'Email verified and account created successfully',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        email_verified: true,
        profile_photo_url: user.profile_photo_url
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP verification email
 *     description: Generates and sends a new 6-digit OTP to the user's email if the previous one expired or was lost. Only works for pending registrations.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPResendInput'
 *           example:
 *             email: "john@example.com"
 *     responses:
 *       200:
 *         description: New OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPSuccessResponse'
 *       400:
 *         description: Email is required or no pending registration found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to send email or server error
 */
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if there's a pending registration
    const pendingUser = await OTPModel.getPendingUser(email);
    if (!pendingUser) {
      return res.status(400).json({ message: 'No pending registration found for this email' });
    }

    // Generate new OTP
    const otp = generateOTP();
    await OTPModel.storeOTP(email, otp);

    // Send OTP email
    await sendOTPEmail(email, otp, pendingUser.username);

    res.status(200).json({
      message: 'New OTP sent to your email'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates user with email and password. Only users with verified emails can login successfully.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginInput'
 *           example:
 *             email: "john@example.com"
 *             password: "securepassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials or email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during authentication
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({
        message: 'Please verify your email before logging in',
        email_not_verified: true
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        profile_photo_url: user.profile_photo_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/test/last-otp:
 *   get:
 *     summary: Get last generated OTP (Testing/Development only)
 *     description: Returns the last generated OTP for testing purposes. Only available in development/test environments.
 *     tags: [Authentication - Testing]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
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
 *       400:
 *         description: No OTP found or invalid email
 *       403:
 *         description: Not available in production
 */
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Initiate password reset process
 *     description: Sends a 6-digit OTP to the user's registered email for password reset verification.
 *     tags: [Authentication]
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
 *       500:
 *         description: Failed to send reset email
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email address' });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(400).json({
        message: 'Please verify your email first before resetting password'
      });
    }

    // Generate and store password reset OTP
    const resetOTP = generateOTP();
    await OTPModel.storePasswordResetOTP(email, resetOTP);

    // Send password reset email
    try {
      // Development/Testing mode: Enhanced OTP logging
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.log('\n' + '='.repeat(60));
        console.log('🔐 PASSWORD RESET OTP GENERATED');
        console.log('='.repeat(60));
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Reset OTP: ${resetOTP}`);
        console.log(`⏰ Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()}`);
        console.log(`🔄 Use this OTP to verify: POST /api/auth/verify-reset-otp`);
        console.log('='.repeat(60) + '\n');

        // Store OTP in global for testing
        global.lastPasswordResetOTP = { email, otp: resetOTP, timestamp: Date.now() };
      }

      await sendPasswordResetEmail(email, resetOTP, user.username);

      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.log(`✅ Password reset email sent successfully to ${email}`);
      }
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
        return res.status(500).json({ message: 'Failed to send password reset email' });
      } else {
        console.warn(`⚠️  Email service failed, but OTP is available above for testing:`, emailError.message);
        console.warn(`   Use Reset OTP: ${resetOTP} for email: ${email}`);
      }
    }

    res.status(200).json({
      message: 'Password reset OTP sent to your email',
      email: email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/verify-reset-otp:
 *   post:
 *     summary: Verify password reset OTP
 *     description: Verifies the password reset OTP and returns a temporary reset token for password change.
 *     tags: [Authentication]
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
 *       500:
 *         description: Server error
 */
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Verify password reset OTP
    const otpResult = await OTPModel.verifyPasswordResetOTP(email, otp);
    if (!otpResult.valid) {
      return res.status(400).json({ message: otpResult.message });
    }

    // Generate temporary reset token (valid for 15 minutes)
    const resetToken = jwt.sign(
      {
        email: email,
        type: 'password_reset',
        timestamp: Date.now()
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Mark OTP as used
    await OTPModel.markPasswordResetOTPAsUsed(email, otp);

    res.status(200).json({
      message: 'Reset OTP verified successfully',
      resetToken: resetToken,
      expiresIn: '15 minutes'
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with verified token
 *     description: Resets user password using the temporary reset token from OTP verification.
 *     tags: [Authentication]
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
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: New JWT token for immediate login
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid or expired reset token
 *       500:
 *         description: Server error
 */
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({ message: 'Invalid reset token' });
      }
    } catch (jwtError) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const { email } = decoded;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Update password
    await User.updatePassword(user.user_id, newPassword);

    // Generate new login token
    const token = signToken(user);

    // Send password change confirmation email
    try {
      await sendPasswordChangeConfirmationEmail(email, user.username);
    } catch (emailError) {
      console.warn('Failed to send password change confirmation:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      message: 'Password reset successfully',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        profile_photo_url: user.profile_photo_url
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password for authenticated user
 *     description: Allows authenticated users to change their password by providing current and new passwords.
 *     tags: [Authentication]
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
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user; // From auth middleware (already the full user object)
    const userId = user.user_id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    await User.updatePassword(userId, newPassword);

    // Generate new login token (invalidates old sessions)
    const token = signToken(user);

    // Send password change confirmation email
    try {
      await sendPasswordChangeConfirmationEmail(user.email, user.username);
    } catch (emailError) {
      console.warn('Failed to send password change confirmation:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      message: 'Password changed successfully',
      token
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Password change failed', error: error.message });
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out the authenticated user. With JWT tokens, this is primarily for client-side cleanup.
 *     tags: [Authentication]
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
 */
exports.logout = async (req, res) => {
  try {
    // For JWT-based auth, logout is mainly handled client-side
    // The client should remove the token from storage
    // In a more advanced setup, you could maintain a blacklist of tokens

    const user = req.user; // From auth middleware (full user object)
    const userId = user.user_id;
    const username = user.username || 'User';

    // Optional: Log the logout event for security auditing
    console.log(`User ${username} (ID: ${userId}) logged out at ${new Date().toISOString()}`);

    // Optional: If implementing token blacklisting, you would add the token to a blacklist here
    // await TokenBlacklist.add(req.token, req.user.exp);

    res.status(200).json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
}; exports.getLastOTPForTesting = async (req, res) => {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      message: 'OTP testing endpoint not available in production'
    });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email parameter required' });
  }

  try {
    // Check if we have a recent registration OTP for this email
    if (global.lastGeneratedOTP && global.lastGeneratedOTP.email === email) {
      const otpData = global.lastGeneratedOTP;
      const generatedAt = new Date(otpData.timestamp);
      const expiresAt = new Date(otpData.timestamp + 10 * 60 * 1000); // 10 minutes

      // Check if OTP is still valid
      if (Date.now() > otpData.timestamp + 10 * 60 * 1000) {
        return res.status(400).json({
          message: 'Last registration OTP has expired',
          email: email,
          expired_at: expiresAt.toISOString()
        });
      }

      return res.json({
        type: 'registration',
        email: email,
        otp: otpData.otp,
        generated_at: generatedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        valid_for_seconds: Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      });
    }

    // Check if we have a recent password reset OTP for this email
    if (global.lastPasswordResetOTP && global.lastPasswordResetOTP.email === email) {
      const otpData = global.lastPasswordResetOTP;
      const generatedAt = new Date(otpData.timestamp);
      const expiresAt = new Date(otpData.timestamp + 10 * 60 * 1000); // 10 minutes

      // Check if OTP is still valid
      if (Date.now() > otpData.timestamp + 10 * 60 * 1000) {
        return res.status(400).json({
          message: 'Last password reset OTP has expired',
          email: email,
          expired_at: expiresAt.toISOString()
        });
      }

      return res.json({
        type: 'password_reset',
        email: email,
        otp: otpData.otp,
        generated_at: generatedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        valid_for_seconds: Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      });
    }

    // Also try to get from database as fallback
    const storedOTP = await OTPModel.getOTP(email);
    if (storedOTP) {
      return res.json({
        type: 'from_database',
        email: email,
        otp: storedOTP.otp,
        generated_at: storedOTP.created_at,
        expires_at: storedOTP.expires_at,
        note: 'Retrieved from database'
      });
    }

    res.status(400).json({
      message: 'No OTP found for this email',
      email: email,
      suggestion: 'Register the user first or request password reset to generate an OTP'
    });
  } catch (error) {
    console.error('Get OTP testing error:', error);
    res.status(500).json({
      message: 'Failed to retrieve OTP',
      error: error.message
    });
  }
};
