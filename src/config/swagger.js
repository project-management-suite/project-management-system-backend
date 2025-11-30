// src/config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management System API',
      version: '2.0.0',
      description: `
## Project Management System API - Complete Documentation

A comprehensive project management system API with full work tracking capabilities including tasks, subtasks, estimates, work logging, team management, and reporting. 

**Features 109 endpoints covering:**
- 🔐 **Authentication** (5 endpoints) - User registration, login, OTP verification
- 📋 **Project Management** (8 endpoints) - Create, manage, and track projects
- ✅ **Task Management** (8 endpoints) - Task creation, assignment, and tracking
- 📝 **Subtask Management** (11 endpoints) - Detailed subtask operations
- ⏱️ **Work Logging** (12 endpoints) - Time tracking and work hour logging
- 📊 **Estimation System** (16 endpoints) - Task estimation and accuracy tracking
- 👥 **Team Management** (14 endpoints) - Team creation, member assignment, collaboration
- 📈 **Reports & Analytics** (6 endpoints) - Performance metrics and reporting
- 📎 **File Management** (7 endpoints) - File upload and document handling
- 👤 **User Profiles** (8 endpoints) - User profile management
- 🗓️ **Calendar** (8 endpoints) - Schedule and calendar features
- ⚙️ **Administration** (6 endpoints) - System administration and user management

### Authentication
All API endpoints except authentication require a valid JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### Getting Started
1. Register a new account at \`/api/auth/register\`
2. Verify your email with the OTP sent to your inbox at \`/api/auth/verify-otp\`
3. Login at \`/api/auth/login\` to receive your JWT token
4. Include the token in all subsequent requests

### User Roles
- **ADMIN**: Full system access, user management, all operations
- **MANAGER**: Project and team management, task assignment, reporting
- **DEVELOPER**: Task execution, work logging, time tracking

### Work Tracking Workflow
1. **Projects** → Create and manage project containers
2. **Tasks** → Define work items within projects
3. **Subtasks** → Break down complex tasks into manageable pieces
4. **Estimates** → Multiple team members can estimate effort required
5. **Assignments** → Assign tasks/subtasks to team members
6. **Work Logs** → Track actual time spent on work items
7. **Analytics** → Compare estimates vs actual time, track productivity

### Response Formats
All endpoints return JSON responses with consistent structure:
- **Success**: \`{ "success": true, "data": {...}, "message": "..." }\`
- **Error**: \`{ "success": false, "message": "Error description", "error": "..." }\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@projectmanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    externalDocs: {
      description: 'Find out more about Project Management System',
      url: 'https://github.com/your-repo/project-management-system'
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://project-management-system-backend-8yt4co2oa.vercel.app'
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number for pagination'
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items per page'
        },
        ProjectIdParam: {
          in: 'path',
          name: 'projectId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Project unique identifier'
        },
        TaskIdParam: {
          in: 'path',
          name: 'taskId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Task unique identifier'
        },
        UserIdParam: {
          in: 'path',
          name: 'userId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'User unique identifier'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied - insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation error - invalid input data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and authorization operations',
        externalDocs: {
          description: 'Learn more about authentication',
          url: 'https://docs.example.com/auth'
        }
      },
      {
        name: 'Projects',
        description: 'Project management operations - create, update, and manage projects'
      },
      {
        name: 'Tasks',
        description: 'Task management - create, assign, and track work items'
      },
      {
        name: 'Subtasks',
        description: 'Subtask operations - break down complex tasks into manageable pieces'
      },
      {
        name: 'WorkLogs',
        description: 'Work time tracking - log hours spent on tasks and subtasks'
      },
      {
        name: 'Estimates',
        description: 'Task estimation system - estimate effort and track accuracy'
      },
      {
        name: 'Teams',
        description: 'Team management - create teams, manage members, assign to projects'
      },
      {
        name: 'Reports',
        description: 'Analytics and reporting - performance metrics and insights'
      },
      {
        name: 'Files',
        description: 'File management - upload and manage project documents'
      },
      {
        name: 'Admin',
        description: 'Administrative functions - user management and system configuration'
      },
      {
        name: 'Calendar',
        description: 'Calendar and scheduling features'
      },
      {
        name: 'Profile',
        description: 'User profile management and settings'
      }
    ]
  },
  apis: [
    // Include all route files for documentation parsing
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    // Include this file for additional configurations
    __filename
  ]
};

/**
 * @swagger
 * components:
 *   examples:
 *     AuthLoginExample:
 *       summary: Login example
 *       value:
 *         email: "john.doe@example.com"
 *         password: "securePassword123"
 *     ProjectCreateExample:
 *       summary: Create project example
 *       value:
 *         project_name: "E-commerce Platform"
 *         description: "A full-featured online shopping platform with user management, product catalog, and payment processing"
 *         start_date: "2024-01-01"
 *         end_date: "2024-06-30"
 *     TaskCreateExample:
 *       summary: Create task example
 *       value:
 *         title: "Implement User Authentication System"
 *         description: "Create secure login/logout functionality with JWT tokens and password encryption"
 *         priority: "HIGH"
 *         due_date: "2024-02-15T23:59:59Z"
 *         estimated_hours: 16
 *     SubtaskCreateExample:
 *       summary: Create subtask example
 *       value:
 *         title: "Design login form UI"
 *         description: "Create responsive login form with email and password fields"
 *         task_id: "550e8400-e29b-41d4-a716-446655440000"
 *         priority: "MEDIUM"
 *         estimated_hours: 4
 *     WorkLogCreateExample:
 *       summary: Create work log example
 *       value:
 *         hours_logged: 3.5
 *         work_date: "2024-01-15"
 *         task_id: "550e8400-e29b-41d4-a716-446655440000"
 *         description: "Implemented login form validation and error handling"
 *         log_type: "DEVELOPMENT"
 *     EstimateCreateExample:
 *       summary: Create estimate example
 *       value:
 *         estimated_hours: 8
 *         task_id: "550e8400-e29b-41d4-a716-446655440000"
 *         complexity: "MEDIUM"
 *         confidence_level: 4
 *         notes: "Based on similar authentication implementations in previous projects"
 */

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
