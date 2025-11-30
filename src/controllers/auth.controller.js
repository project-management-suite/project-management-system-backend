// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const OTPModel = require('../models/otp.model');
const { generateOTP, sendOTPEmail } = require('../utils/mailer');

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
        email_verified: true
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
        email_verified: user.email_verified
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
exports.getLastOTPForTesting = async (req, res) => {
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
    // Check if we have a recent OTP for this email
    if (global.lastGeneratedOTP && global.lastGeneratedOTP.email === email) {
      const otpData = global.lastGeneratedOTP;
      const generatedAt = new Date(otpData.timestamp);
      const expiresAt = new Date(otpData.timestamp + 10 * 60 * 1000); // 10 minutes

      // Check if OTP is still valid
      if (Date.now() > otpData.timestamp + 10 * 60 * 1000) {
        return res.status(400).json({
          message: 'Last OTP has expired',
          email: email,
          expired_at: expiresAt.toISOString()
        });
      }

      return res.json({
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
      suggestion: 'Register the user first to generate an OTP'
    });
  } catch (error) {
    console.error('Get OTP testing error:', error);
    res.status(500).json({
      message: 'Failed to retrieve OTP',
      error: error.message
    });
  }
};
