// src/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendMail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
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
