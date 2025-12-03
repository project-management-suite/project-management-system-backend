const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const { CalendarController } = require('../controllers/calendar.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/calendar/events:
 *   get:
 *     tags: [Calendar]
 *     summary: Get all calendar events for the authenticated user
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   time:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [meeting, task_due, milestone]
 *                   location:
 *                     type: string
 *                   attendees:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get('/events', CalendarController.getEvents);

/**
 * @openapi
 * /api/calendar/meetings:
 *   post:
 *     tags: [Calendar]
 *     summary: Create a new meeting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - time
 *             properties:
 *               title:
 *                 type: string
 *                 description: Meeting title
 *               description:
 *                 type: string
 *                 description: Meeting description
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Meeting date (YYYY-MM-DD)
 *               time:
 *                 type: string
 *                 description: Meeting time (HH:MM)
 *               location:
 *                 type: string
 *                 description: Meeting location or video link
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of user IDs to invite
 *     responses:
 *       201:
 *         description: Meeting created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/meetings', CalendarController.createMeeting);

/**
 * @openapi
 * /api/calendar/meetings/{id}:
 *   put:
 *     tags: [Calendar]
 *     summary: Update a meeting
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               location:
 *                 type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 *       403:
 *         description: Not authorized to update this meeting
 *       404:
 *         description: Meeting not found
 */
router.put('/meetings/:id', CalendarController.updateMeeting);

/**
 * @openapi
 * /api/calendar/events/{id}:
 *   delete:
 *     tags: [Calendar]
 *     summary: Delete an event (meeting only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Not authorized to delete this event
 *       404:
 *         description: Event not found
 */
router.delete('/events/:id', CalendarController.deleteEvent);

/**
 * @openapi
 * /api/calendar/meetings/{meetingId}/attendance:
 *   put:
 *     tags: [Calendar]
 *     summary: Update meeting attendance status
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, declined, tentative]
 *                 description: Attendance status
 *     responses:
 *       200:
 *         description: Attendance status updated successfully
 *       404:
 *         description: Meeting invitation not found
 */
router.put('/meetings/:meetingId/attendance', CalendarController.updateAttendanceStatus);

module.exports = router;