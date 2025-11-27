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

// Ensure swagger runs before any auth middleware (place here)
app.use('/api-docs',
  (req, res, next) => {
    // Optional: skip auth if a global auth middleware exists later
    req.skipAuth = true;
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// REMOVE debug type logs now that routes fixed
// app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Simple health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

startScheduledJobs();

module.exports = app;
