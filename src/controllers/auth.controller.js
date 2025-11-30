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
      // Development mode: Log OTP to console if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 OTP for ${email}: ${otp} (Development Mode)`);
        console.log(`⏰ OTP expires in 10 minutes`);
        try {
          await sendOTPEmail(email, otp, username);
          console.log(`✅ OTP email sent successfully to ${email}`);
        } catch (emailError) {
          console.warn(`⚠️  Email failed, but OTP is logged above for development:`, emailError.message);
        }
      } else {
        await sendOTPEmail(email, otp, username);
      }
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      if (process.env.NODE_ENV !== 'development') {
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
