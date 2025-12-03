// src/utils/mailer.js
const nodemailer = require('nodemailer');

// Validate email configuration
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('SMTP_USER and SMTP_PASS environment variables are required for email functionality');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: true, // Use true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000, // 5 seconds
  socketTimeout: 10000, // 10 seconds
});

// Generate 6-digit OTP
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
exports.sendOTPEmail = async (email, otp, username) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - Project Management System</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: #2d3748;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 30px;
          text-align: center;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #3182ce;
          background: #edf2f7;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          letter-spacing: 5px;
        }
        .footer {
          background: #f7fafc;
          padding: 20px;
          text-align: center;
          color: #4a5568;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Project Management System</h1>
          <p>Email Verification Required</p>
        </div>
        <div class="content">
          <h2>Welcome ${username}!</h2>
          <p>Thank you for registering with our Project Management System. To complete your registration, please verify your email address using the OTP below:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>Project Management System Team</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || `"Project Management System 🚀" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Email Verification - Project Management System',
    html: html
  });

  return info;
};

// Send password reset OTP email
exports.sendPasswordResetEmail = async (email, otp, username) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Project Management System</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: #e53e3e;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 30px;
          text-align: center;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #e53e3e;
          background: #fed7d7;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          letter-spacing: 5px;
        }
        .warning {
          background: #fef5e7;
          border-left: 4px solid #d69e2e;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          text-align: left;
        }
        .footer {
          background: #f7fafc;
          padding: 20px;
          text-align: center;
          color: #4a5568;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Project Management System</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="content">
          <h2>Hi ${username},</h2>
          <p>We received a request to reset your password. Use the OTP below to proceed with your password reset:</p>
          
          <div class="otp-code">${otp}</div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            • This OTP will expire in 10 minutes<br>
            • Only use this OTP on our official website<br>
            • If you didn't request this, please ignore this email
          </div>
          
          <p>After verifying this OTP, you'll be able to set a new password for your account.</p>
        </div>
        <div class="footer">
          <p>Project Management System Security Team</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || `"Project Management System 🔐" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request - Project Management System',
    html: html
  });

  return info;
};

// Send password change confirmation email
exports.sendPasswordChangeConfirmationEmail = async (email, username) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Changed - Project Management System</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: #38a169;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 30px;
          text-align: center;
        }
        .success-icon {
          font-size: 64px;
          margin: 20px 0;
        }
        .info-box {
          background: #e6fffa;
          border-left: 4px solid #38a169;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          text-align: left;
        }
        .footer {
          background: #f7fafc;
          padding: 20px;
          text-align: center;
          color: #4a5568;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Project Management System</h1>
          <p>Password Changed Successfully</p>
        </div>
        <div class="content">
          <div class="success-icon">✅</div>
          <h2>Hi ${username},</h2>
          <p>Your password has been successfully changed.</p>
          
          <div class="info-box">
            <strong>📅 Changed on:</strong> ${new Date().toLocaleString()}<br>
            <strong>🌍 From:</strong> Your account<br><br>
            <strong>🛡️ What's Next:</strong><br>
            • You've been automatically logged in with a new session<br>
            • Your old sessions have been invalidated for security<br>
            • You can continue using the application normally
          </div>
          
          <p><strong>If you did not make this change, please contact support immediately.</strong></p>
        </div>
        <div class="footer">
          <p>Project Management System Security Team</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || `"Project Management System 🔒" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Changed Successfully - Project Management System',
    html: html
  });

  return info;
};

// Send account deletion OTP email
exports.sendAccountDeletionEmail = async (email, otp, username) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deletion Verification - Project Management System</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: #c53030;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 30px;
          text-align: center;
        }
        .warning-box {
          background: #fff5f5;
          border: 2px solid #fc8181;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #c53030;
          background: #fff5f5;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          letter-spacing: 5px;
        }
        .footer {
          background: #f7fafc;
          padding: 20px;
          text-align: center;
          color: #4a5568;
          font-size: 14px;
        }
        .warning-icon {
          font-size: 48px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="warning-icon">⚠️</div>
          <h1>🚀 Project Management System</h1>
          <p>Account Deletion Request</p>
        </div>
        <div class="content">
          <h2>Hi ${username},</h2>
          <p>We received a request to permanently delete your account.</p>
          
          <div class="warning-box">
            <strong style="color: #c53030;">⚠️ WARNING: This action is permanent and cannot be undone!</strong><br><br>
            <strong>What will be deleted:</strong><br>
            • Your profile and personal information<br>
            • All projects you created<br>
            • All tasks and assignments<br>
            • All files you uploaded<br>
            • All work logs and reports<br>
            • Team memberships and notifications<br><br>
            <strong>This deletion cannot be reversed!</strong>
          </div>
          
          <p>To confirm this permanent deletion, use the OTP below:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          
          <div class="warning-box">
            <strong>If you did NOT request this deletion:</strong><br>
            • Ignore this email - your account will remain safe<br>
            • Change your password immediately<br>
            • Contact support if you're concerned about unauthorized access
          </div>
        </div>
        <div class="footer">
          <p>Project Management System Security Team</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || `"Project Management System ⚠️" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '⚠️ Account Deletion Verification - Project Management System',
    html: html
  });

  return info;
};

exports.sendMail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || `"Project Management System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html
  });
  return info;
};

exports.sendProjectNotification = async (userIdsOrEmails, message) => {
  // Accept array of user ids or emails; in real app resolve ids -> emails
  const recipients = Array.isArray(userIdsOrEmails) ? userIdsOrEmails : [userIdsOrEmails];
  // For demo: assume array of emails
  for (const r of recipients) {
    try {
      await exports.sendMail({ to: r, subject: 'Project Notification', text: message });
    } catch (err) {
      console.warn('Failed to send mail to', r, err.message);
    }
  }
};
