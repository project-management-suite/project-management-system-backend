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

// Fun homepage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Management System API</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
            }
            .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 3rem;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                border: 1px solid rgba(255, 255, 255, 0.18);
                max-width: 600px;
            }
            h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
                background: linear-gradient(45deg, #ffd89b, #19547b);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .emoji {
                font-size: 4rem;
                margin-bottom: 1rem;
                display: block;
            }
            p {
                font-size: 1.2rem;
                margin-bottom: 2rem;
                line-height: 1.6;
            }
            .links {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            .btn {
                padding: 12px 24px;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 50px;
                color: white;
                text-decoration: none;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            .btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .status {
                margin-top: 2rem;
                padding: 1rem;
                background: rgba(0, 255, 0, 0.1);
                border-radius: 10px;
                border: 1px solid rgba(0, 255, 0, 0.3);
            }
            .tech-stack {
                margin-top: 2rem;
                font-size: 0.9rem;
                opacity: 0.8;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <span class="emoji">🚀</span>
            <h1>Project Management API</h1>
            <p>
                Welcome to our awesome Project Management System backend! <br/>
                This API powers amazing project management features. <br/>
                But hey, APIs are not meant to be seen directly... 👀
            </p>
            
            <div class="links">
                <a href="https://project-management-system-fsad.netlify.app" class="btn">
                    🌟 Visit Frontend
                </a>
                <a href="/api-docs" class="btn">
                    📚 API Documentation
                </a>
                <a href="/api/health" class="btn">
                    ❤️ Health Check
                </a>
            </div>
            
            <div class="status">
                <strong>🟢 Server Status:</strong> Running & Ready!
            </div>
            
            <div class="tech-stack">
                Powered by Node.js ⚡ Express.js 🛣️ Supabase 🗄️ Vercel ☁️
            </div>
        </div>
    </body>
    </html>
  `);
});

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

startScheduledJobs();

module.exports = app;
