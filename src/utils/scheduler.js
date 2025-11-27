// src/utils/scheduler.js
const cron = require('node-cron');
const dayjs = require('dayjs');
const { sendMail } = require('./mailer');
const Project = require('../models/project.model');

exports.startScheduledJobs = () => {
  const cronExpr = process.env.REPORT_CRON || '0 8 * * MON'; // default weekly Monday 8:00
  cron.schedule(cronExpr, async () => {
    try {
      // Implement your report generation logic here
      const projects = await Project.find().limit(50);
      const reportText = `Weekly snapshot: ${projects.length} projects as of ${dayjs().format()}`;
      // Send to admin or configured list
      await sendMail({ to: process.env.SMTP_USER, subject: 'Weekly Project Report', text: reportText });
      console.log('Weekly report sent');
    } catch (err) {
      console.error('Report job failed', err);
    }
  });
};
