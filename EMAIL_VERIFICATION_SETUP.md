# Email OTP Verification Setup

## Overview

The project now includes email verification using 6-digit OTP codes sent via Gmail SMTP.

## Email Configuration

Add these environment variables to your `.env` file:

```bash
# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=c74369299@gmail.com
SMTP_PASS=wgdy ojcq gmwz cbze

# Email From Address
EMAIL_FROM="Project Management System 🚀 <c74369299@gmail.com>"
```

## Registration Flow

### 1. User Registration

```bash
POST /api/auth/register
{
  "username": "john_doe",
  "email": "user@example.com",
  "password": "password123",
  "role": "DEVELOPER"
}
```

**Response:**

```json
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "user@example.com"
}
```

### 2. Email Verification

User receives a beautiful HTML email with 6-digit OTP (expires in 10 minutes).

### 3. OTP Verification

```bash
POST /api/auth/verify-otp
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "message": "Email verified and account created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "user@example.com",
    "role": "DEVELOPER",
    "email_verified": true
  }
}
```

### 4. Resend OTP (Optional)

```bash
POST /api/auth/resend-otp
{
  "email": "user@example.com"
}
```

## Database Changes

### New Tables:

1. **email_otps** - Stores OTP codes with expiration
2. **pending_registrations** - Stores user data during verification

### Updated Tables:

1. **profiles** - Added `email_verified` boolean column

## Security Features

- ✅ **6-digit OTP** generation
- ✅ **10-minute expiration** for OTPs
- ✅ **One-time use** OTP validation
- ✅ **Email verification required** before login
- ✅ **Automatic cleanup** of expired OTPs
- ✅ **Beautiful HTML email** template
- ✅ **Secure pending registration** storage

## Email Template Features

- 🎨 **Modern Design** with glassmorphism effects
- 📱 **Responsive Layout** for all devices
- 🚀 **Brand Consistent** styling
- 💫 **Professional Appearance**

## API Endpoints

| Method | Endpoint               | Description                     |
| ------ | ---------------------- | ------------------------------- |
| POST   | `/api/auth/register`   | Send OTP to email               |
| POST   | `/api/auth/verify-otp` | Verify OTP & create account     |
| POST   | `/api/auth/resend-otp` | Resend OTP                      |
| POST   | `/api/auth/login`      | Login (requires verified email) |

## Testing

1. Register with a real email address
2. Check your inbox for the OTP email
3. Use the 6-digit code to verify
4. Login with your credentials

The system is now production-ready with secure email verification! 🎉
