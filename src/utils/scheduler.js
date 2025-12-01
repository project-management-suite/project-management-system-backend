// src/utils/scheduler.js
const cron = require('node-cron');
const dayjs = require('dayjs');
const { sendMail } = require('./mailer');
const Project = require('../models/project.model');
const DeadlineReminder = require('../models/deadlineReminder.model');
const Notification = require('../models/notification.model');

exports.startScheduledJobs = () => {
  // Weekly report generation
  const reportCron = process.env.REPORT_CRON || '0 8 * * MON'; // default weekly Monday 8:00
  cron.schedule(reportCron, async () => {
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

  // Process deadline reminders every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('Processing deadline reminders...');

      const pendingReminders = await DeadlineReminder.getPendingReminders(50);
      let processed = 0;
      let sent = 0;

      for (const reminder of pendingReminders) {
        try {
          processed++;

          // Check if user wants reminders
          const wantsReminder = reminder.profiles?.notification_preferences?.deadline_reminders !== false;
          const wantsEmail = reminder.profiles?.notification_preferences?.email_notifications !== false;

          if (!wantsReminder) {
            // Mark as sent even if user doesn't want it to prevent re-processing
            await DeadlineReminder.markAsSent([reminder.reminder_id]);
            continue;
          }

          // Create in-app notification
          await Notification.create({
            user_id: reminder.user_id,
            title: 'Task Deadline Reminder',
            message: `Task "${reminder.tasks.title}" is due on ${new Date(reminder.tasks.end_date).toLocaleDateString()}`,
            type: 'DEADLINE_REMINDER',
            related_entity_type: 'task',
            related_entity_id: reminder.task_id
          });

          // Send email if requested
          if ((reminder.reminder_type === 'email' || reminder.reminder_type === 'both') && wantsEmail) {
            await sendMail({
              to: reminder.profiles.email,
              subject: `Task Deadline Reminder: ${reminder.tasks.title}`,
              html: `
                <h2>Task Deadline Reminder</h2>
                <p>Hello ${reminder.profiles.first_name} ${reminder.profiles.last_name},</p>
                <p>This is a reminder that your task "<strong>${reminder.tasks.title}</strong>" is due on <strong>${new Date(reminder.tasks.end_date).toLocaleDateString()}</strong>.</p>
                <p><strong>Project:</strong> ${reminder.tasks.projects?.project_name || 'Unknown Project'}</p>
                <p><strong>Priority:</strong> ${reminder.tasks.priority}</p>
                ${reminder.tasks.description ? `<p><strong>Description:</strong> ${reminder.tasks.description}</p>` : ''}
                <p>Please ensure to complete this task on time.</p>
                <p>Best regards,<br>Project Management System</p>
              `
            });
          }

          // Mark as sent
          await DeadlineReminder.markAsSent([reminder.reminder_id]);
          sent++;

        } catch (error) {
          console.error(`Failed to process reminder ${reminder.reminder_id}:`, error);
        }
      }

      if (processed > 0) {
        console.log(`Processed ${processed} deadline reminders, sent ${sent}`);
      }
    } catch (err) {
      console.error('Deadline reminder job failed:', err);
    }
  });

  // Check for overdue tasks and create escalation reminders (daily at 9 AM)
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('Checking for overdue tasks...');

      const overdueReminders = await DeadlineReminder.getOverdueReminders();
      let escalationsCreated = 0;

      for (const reminder of overdueReminders) {
        try {
          // Get project manager for escalation
          const managerId = reminder.tasks.projects?.owner_manager_id;
          if (managerId && managerId !== reminder.user_id) {
            // Create escalation reminder for manager
            await DeadlineReminder.createEscalationReminders(
              reminder.task_id,
              managerId,
              [1] // 1 day from now
            );
            escalationsCreated++;
          }

          // Mark original reminder as sent to prevent reprocessing
          await DeadlineReminder.markAsSent([reminder.reminder_id]);

        } catch (error) {
          console.error(`Failed to create escalation for reminder ${reminder.reminder_id}:`, error);
        }
      }

      if (escalationsCreated > 0) {
        console.log(`Created ${escalationsCreated} escalation reminders for overdue tasks`);
      }
    } catch (err) {
      console.error('Overdue task escalation job failed:', err);
    }
  });

  console.log('Scheduled jobs started:');
  console.log('- Weekly reports:', reportCron);
  console.log('- Deadline reminders: every 15 minutes');
  console.log('- Overdue task escalations: daily at 9 AM');
};
