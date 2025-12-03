// src/routes/report.routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const reportController = require('../controllers/report.controller');

router.use(authenticate);

/**
 * @openapi
 * /api/reports/weekly/{projectId}:
 *   get:
 *     tags: [Reports]
 *     summary: Generate weekly project report
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Week start date (defaults to current week)
 *     responses:
 *       200:
 *         description: Weekly report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 report:
 *                   type: object
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied
 */
router.get('/weekly/:projectId', reportController.getWeeklyReport);

/**
 * @openapi
 * /api/reports/monthly/{projectId}:
 *   get:
 *     tags: [Reports]
 *     summary: Generate monthly project report
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
 *         description: Monthly report generated successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Access denied
 */
router.get('/monthly/:projectId', reportController.getMonthlyReport);

/**
 * @openapi
 * /api/reports/custom:
 *   get:
 *     tags: [Reports]
 *     summary: Generate custom date range report
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Project ID (optional, for project-specific reports)
 *       - in: query
 *         name: includeTeamStats
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include team performance statistics
 *     responses:
 *       200:
 *         description: Custom report generated successfully
 *       400:
 *         description: Invalid date range
 */
router.get('/custom', reportController.getCustomReport);

/**
 * @openapi
 * /api/reports/manager-analytics:
 *   get:
 *     tags: [Reports]
 *     summary: Get comprehensive manager analytics with KPIs
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by specific project (optional)
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           default: '30'
 *         description: Time range in days (e.g., 7, 30, 90)
 *     responses:
 *       200:
 *         description: Manager analytics retrieved successfully
 *       403:
 *         description: Access denied - Manager or Admin role required
 */
router.get('/manager-analytics', reportController.getManagerAnalytics);

/**
 * @openapi
 * /api/reports/analytics:
 *   get:
 *     tags: [Reports]
 *     summary: Get dashboard analytics overview
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalProjects:
 *                           type: integer
 *                         totalTasks:
 *                           type: integer
 *                         completedTasks:
 *                           type: integer
 *                         overdueTasks:
 *                           type: integer
 *                     thisMonth:
 *                       type: object
 *                     statusDistribution:
 *                       type: object
 *                     projectBreakdown:
 *                       type: array
 */
router.get('/analytics', reportController.getDashboardAnalytics);

/**
 * @openapi
 * /api/reports/export/pdf:
 *   post:
 *     tags: [Reports]
 *     summary: Export report to PDF
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [weekly, monthly, custom]
 *                 description: Type of report to generate
 *               projectId:
 *                 type: string
 *                 description: Project ID (required for weekly/monthly reports)
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for the report
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date (required for custom reports)
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 reportId:
 *                   type: string
 *                 downloadUrl:
 *                   type: string
 *                 filename:
 *                   type: string
 *       400:
 *         description: Invalid request parameters
 */
router.post('/export/pdf', reportController.exportReportPDF);

/**
 * @openapi
 * /api/reports/download/{reportId}:
 *   get:
 *     tags: [Reports]
 *     summary: Download generated PDF report
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Report not found
 *       403:
 *         description: Access denied
 */
router.get('/download/:reportId', reportController.downloadReportPDF);

module.exports = router;
