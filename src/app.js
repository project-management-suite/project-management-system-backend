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
const adminRoutes = require('./routes/admin.routes');
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
app.get('/api-docs', (req, res) => {
  res.send(apiDocsHTML);
});

// Serve swagger JSON separately  
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// REMOVE debug type logs now that routes fixed
// app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

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
