// src/routes/calendar.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const calendarController = require('../controllers/calendar.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/calendar/holidays:
 *   get:
 *     tags: [Calendar]
 *     summary: Get company holidays
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter holidays by year
 *     responses:
 *       200:
 *         description: Holidays retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 holidays:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       holiday_id:
 *                         type: string
 *                       holiday_name:
 *                         type: string
 *                       holiday_date:
 *                         type: string
 *                         format: date
 *                       description:
 *                         type: string
 *                       is_recurring:
 *                         type: boolean
 *   post:
 *     tags: [Calendar]
 *     summary: Add a new holiday (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - holiday_name
 *               - holiday_date
 *             properties:
 *               holiday_name:
 *                 type: string
 *                 description: Name of the holiday
 *               holiday_date:
 *                 type: string
 *                 format: date
 *                 description: Date of the holiday (YYYY-MM-DD)
 *               description:
 *                 type: string
 *                 description: Holiday description
 *               is_recurring:
 *                 type: boolean
 *                 default: false
 *                 description: Whether holiday repeats annually
 *     responses:
 *       201:
 *         description: Holiday added successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Holiday already exists on this date
 *       403:
 *         description: Admin access required
 */
router.get('/holidays', calendarController.getHolidays);
router.post('/holidays', authorizeRoles('ADMIN'), calendarController.addHoliday);

/**
 * @openapi
 * /api/calendar/holidays/{id}:
 *   put:
 *     tags: [Calendar]
 *     summary: Update a holiday (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Holiday ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               holiday_name:
 *                 type: string
 *               holiday_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               is_recurring:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Holiday updated successfully
 *       404:
 *         description: Holiday not found
 *       403:
 *         description: Admin access required
 *   delete:
 *     tags: [Calendar]
 *     summary: Delete a holiday (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Holiday ID
 *     responses:
 *       200:
 *         description: Holiday deleted successfully
 *       404:
 *         description: Holiday not found
 *       403:
 *         description: Admin access required
 */
router.put('/holidays/:id', authorizeRoles('ADMIN'), calendarController.updateHoliday);
router.delete('/holidays/:id', authorizeRoles('ADMIN'), calendarController.deleteHoliday);

/**
 * @openapi
 * /api/calendar/tasks:
 *   get:
 *     tags: [Calendar]
 *     summary: Get calendar view of tasks
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter tasks by project ID
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12, defaults to current month)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (defaults to current year)
 *     responses:
 *       200:
 *         description: Calendar tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 calendar:
 *                   type: object
 *                   properties:
 *                     month:
 *                       type: integer
 *                     year:
 *                       type: integer
 *                     tasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           status:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           endDate:
 *                             type: string
 *                             format: date
 *                           project:
 *                             type: object
 *                           assignees:
 *                             type: array
 *                             items:
 *                               type: string
 *                           isOverdue:
 *                             type: boolean
 *                     holidays:
 *                       type: array
 *       403:
 *         description: Access denied to project
 */
router.get('/tasks', calendarController.getTasksCalendar);

/**
 * @openapi
 * /api/calendar/deadlines:
 *   get:
 *     tags: [Calendar]
 *     summary: Get upcoming deadlines
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *           maximum: 30
 *         description: Number of days to look ahead (max 30)
 *     responses:
 *       200:
 *         description: Upcoming deadlines retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 deadlines:
 *                   type: object
 *                   properties:
 *                     overdue:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeadlineTask'
 *                     today:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeadlineTask'
 *                     thisWeek:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeadlineTask'
 *                     nextWeek:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeadlineTask'
 *                     later:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeadlineTask'
 */
router.get('/deadlines', calendarController.getUpcomingDeadlines);

/**
 * @openapi
 * /api/calendar/reminders:
 *   post:
 *     tags: [Calendar]
 *     summary: Set deadline reminder for a task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - reminderDate
 *             properties:
 *               taskId:
 *                 type: string
 *                 description: Task ID
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *                 description: When to send the reminder
 *               reminderType:
 *                 type: string
 *                 enum: [email, notification, both]
 *                 default: email
 *                 description: Type of reminder
 *     responses:
 *       201:
 *         description: Deadline reminder set successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Task not found
 *       403:
 *         description: Access denied to task
 *       409:
 *         description: Reminder already exists for this date
 */
router.post('/reminders', calendarController.setDeadlineReminder);

/**
 * @openapi
 * /api/calendar/projects/{projectId}:
 *   get:
 *     tags: [Calendar]
 *     summary: Get project calendar view with milestones
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12, defaults to current month)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (defaults to current year)
 *     responses:
 *       200:
 *         description: Project calendar retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 projectCalendar:
 *                   type: object
 *                   properties:
 *                     project:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                     month:
 *                       type: integer
 *                     year:
 *                       type: integer
 *                     tasks:
 *                       type: array
 *                     milestones:
 *                       type: array
 *                     holidays:
 *                       type: array
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied to project
 */
router.get('/projects/:projectId', calendarController.getProjectCalendar);

module.exports = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     DeadlineTask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         endDate:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *         daysUntilDeadline:
 *           type: integer
 *         project:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         assignees:
 *           type: array
 *           items:
 *             type: string
 */