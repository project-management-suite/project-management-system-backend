// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger/swaggerDef');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const fileRoutes = require('./routes/file.routes');
const reportRoutes = require('./routes/report.routes');
const calendarRoutes = require('./routes/calendar.routes');
const profileRoutes = require('./routes/profile.routes');
const adminRoutes = require('./routes/admin.routes');
const teamRoutes = require('./routes/team.routes');
const { errorHandler } = require('./middlewares/error.middleware');
const { startScheduledJobs } = require('./utils/scheduler');
const { homepageHTML } = require('./views/homepage');
const { apiDocsHTML } = require('./views/apiDocs');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// TEMP request trace
app.use((req, res, next) => {
  console.log('[TRACE]', req.method, req.originalUrl);
  next();
});

// API Documentation - Custom implementation for Vercel compatibility
app.get('/api/docs', (req, res) => {
  res.send(apiDocsHTML);
});

// Custom HTML Documentation alternative route
app.get('/docs', (req, res) => {
  res.send(apiDocsHTML);
});

// Real Swagger UI 
app.use('/api/swagger',
  (req, res, next) => {
    // Optional: skip auth if a global auth middleware exists later
    req.skipAuth = true;
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Project Management API - Swagger UI'
  })
);

// Serve swagger JSON separately  
app.get('/api/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamRoutes);

app.get('/', (req, res) => {
  res.send(homepageHTML);
});

app.get('/api', (req, res) => {
  res.send(homepageHTML);
});

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

startScheduledJobs();

module.exports = app;
