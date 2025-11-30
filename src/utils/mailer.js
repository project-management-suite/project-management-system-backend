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
