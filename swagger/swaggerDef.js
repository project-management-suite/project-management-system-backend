const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management System API',
      version: '2.0.0',
      description: 'A comprehensive project management system API with full work tracking capabilities including tasks, subtasks, estimates, work logging, team management, and reporting. Features 109 endpoints covering authentication, project management, task tracking, time logging, estimation, and administrative functions.',
      contact: {
        name: 'API Support',
        email: 'support@projectmanagement.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://project-management-system-backend-8yt4co2oa.vercel.app'
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Error message' },
            error: { type: 'string', description: 'Technical error details' }
          },
          example: {
            message: 'Resource not found',
            error: 'The requested resource does not exist'
          }
        },

        // Authentication Schemas
        AuthRegisterInput: {
          type: 'object',
          required: ['username', 'email', 'password', 'role'],
          properties: {
            username: { type: 'string', description: 'User display name', example: 'john_doe' },
            email: { type: 'string', format: 'email', description: 'User email address', example: 'john@example.com' },
            password: { type: 'string', minLength: 6, description: 'User password (min 6 characters)', example: 'password123' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'DEVELOPER'],
              description: 'User role in the system',
              example: 'DEVELOPER'
            }
          }
        },
        AuthLoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' }
          }
        },
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User unique identifier', example: 'uuid-123' },
            username: { type: 'string', description: 'User display name', example: 'john_doe' },
            email: { type: 'string', format: 'email', description: 'User email address', example: 'john@example.com' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'DEVELOPER'],
              description: 'User role in the system',
              example: 'DEVELOPER'
            },
            email_verified: { type: 'boolean', description: 'Whether email has been verified', example: true },
            created_at: { type: 'string', format: 'date-time', description: 'Account creation timestamp' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT authentication token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/UserPublic' }
          }
        },

        // Project Schemas
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Project unique identifier' },
            project_name: { type: 'string', description: 'Project name', example: 'E-commerce Website' },
            description: { type: 'string', description: 'Project description', example: 'A full-featured e-commerce platform' },
            status: {
              type: 'string',
              enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
              description: 'Project status',
              example: 'IN_PROGRESS'
            },
            start_date: { type: 'string', format: 'date', description: 'Project start date' },
            end_date: { type: 'string', format: 'date', description: 'Project end date' },
            created_by: { type: 'string', format: 'uuid', description: 'Creator user ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        CreateProjectInput: {
          type: 'object',
          required: ['project_name'],
          properties: {
            project_name: { type: 'string', minLength: 3, maxLength: 100, example: 'New Project' },
            description: { type: 'string', maxLength: 1000, example: 'Project description' },
            start_date: { type: 'string', format: 'date', example: '2024-01-01' },
            end_date: { type: 'string', format: 'date', example: '2024-12-31' }
          }
        },

        // Task Schemas
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Task unique identifier' },
            title: { type: 'string', description: 'Task title', example: 'Implement user authentication' },
            description: { type: 'string', description: 'Task description' },
            project_id: { type: 'string', format: 'uuid', description: 'Associated project ID' },
            assigned_to: { type: 'string', format: 'uuid', description: 'Assigned user ID' },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              description: 'Task priority',
              example: 'HIGH'
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'],
              description: 'Task status',
              example: 'IN_PROGRESS'
            },
            due_date: { type: 'string', format: 'date-time', description: 'Task due date' },
            estimated_hours: { type: 'number', description: 'Estimated completion hours', example: 8 },
            actual_hours: { type: 'number', description: 'Actual hours spent', example: 6.5 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },

        // Subtask Schemas
        Subtask: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Subtask unique identifier' },
            title: { type: 'string', description: 'Subtask title', example: 'Create login form' },
            description: { type: 'string', description: 'Subtask description' },
            task_id: { type: 'string', format: 'uuid', description: 'Parent task ID' },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              example: 'MEDIUM'
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'],
              example: 'TODO'
            },
            due_date: { type: 'string', format: 'date-time' },
            estimated_hours: { type: 'number', example: 4 },
            actual_hours: { type: 'number', example: 3.5 },
            created_by: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateSubtaskInput: {
          type: 'object',
          required: ['title', 'task_id'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Create login form' },
            description: { type: 'string', maxLength: 1000, example: 'Implement user login interface' },
            task_id: { type: 'string', format: 'uuid', example: 'task-uuid-123' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'MEDIUM' },
            due_date: { type: 'string', format: 'date-time', example: '2024-12-31T23:59:59Z' },
            estimated_hours: { type: 'number', minimum: 0.1, maximum: 1000, example: 4 }
          }
        },

        // Work Log Schemas
        WorkLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Work log unique identifier' },
            user_id: { type: 'string', format: 'uuid', description: 'User who logged the work' },
            task_id: { type: 'string', format: 'uuid', description: 'Associated task ID (optional)' },
            subtask_id: { type: 'string', format: 'uuid', description: 'Associated subtask ID (optional)' },
            hours_logged: { type: 'number', description: 'Hours worked', example: 2.5 },
            work_date: { type: 'string', format: 'date', description: 'Date work was performed', example: '2024-01-15' },
            description: { type: 'string', description: 'Work description', example: 'Implemented user authentication logic' },
            log_type: {
              type: 'string',
              enum: ['DEVELOPMENT', 'TESTING', 'REVIEW', 'DOCUMENTATION', 'MEETING', 'RESEARCH', 'BUG_FIX', 'OTHER'],
              description: 'Type of work performed',
              example: 'DEVELOPMENT'
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateWorkLogInput: {
          type: 'object',
          required: ['hours_logged', 'work_date'],
          properties: {
            hours_logged: { type: 'number', minimum: 0.1, maximum: 24, example: 2.5 },
            work_date: { type: 'string', format: 'date', example: '2024-01-15' },
            task_id: { type: 'string', format: 'uuid', example: 'task-uuid-123' },
            subtask_id: { type: 'string', format: 'uuid', example: 'subtask-uuid-456' },
            description: { type: 'string', maxLength: 1000, example: 'Worked on user authentication' },
            log_type: {
              type: 'string',
              enum: ['DEVELOPMENT', 'TESTING', 'REVIEW', 'DOCUMENTATION', 'MEETING', 'RESEARCH', 'BUG_FIX', 'OTHER'],
              example: 'DEVELOPMENT'
            }
          }
        },

        // Estimate Schemas
        TaskEstimate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Estimate unique identifier' },
            estimator_id: { type: 'string', format: 'uuid', description: 'User who made the estimate' },
            task_id: { type: 'string', format: 'uuid', description: 'Associated task ID (optional)' },
            subtask_id: { type: 'string', format: 'uuid', description: 'Associated subtask ID (optional)' },
            estimated_hours: { type: 'number', description: 'Estimated completion hours', example: 8 },
            actual_hours: { type: 'number', description: 'Actual hours (filled when completed)', example: 6.5 },
            complexity: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
              description: 'Estimated complexity',
              example: 'MEDIUM'
            },
            confidence_level: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Confidence in estimate (1-5)',
              example: 4
            },
            notes: { type: 'string', description: 'Additional estimation notes', example: 'Based on similar tasks' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateEstimateInput: {
          type: 'object',
          required: ['estimated_hours'],
          properties: {
            estimated_hours: { type: 'number', minimum: 0.1, maximum: 1000, example: 8 },
            task_id: { type: 'string', format: 'uuid', example: 'task-uuid-123' },
            subtask_id: { type: 'string', format: 'uuid', example: 'subtask-uuid-456' },
            complexity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'], example: 'MEDIUM' },
            confidence_level: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            notes: { type: 'string', maxLength: 1000, example: 'Estimate based on similar features' }
          }
        },

        // Additional Task Schemas
        CreateTaskInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Implement user authentication' },
            description: { type: 'string', maxLength: 1000, example: 'Create secure login system with JWT tokens' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
            due_date: { type: 'string', format: 'date-time', example: '2024-12-31T23:59:59Z' },
            estimated_hours: { type: 'number', minimum: 0.1, maximum: 1000, example: 16 },
            assigned_to: { type: 'string', format: 'uuid', example: 'user-uuid-456' }
          }
        },
        UpdateTaskInput: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200 },
            description: { type: 'string', maxLength: 1000 },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'] },
            due_date: { type: 'string', format: 'date-time' },
            estimated_hours: { type: 'number', minimum: 0.1, maximum: 1000 },
            actual_hours: { type: 'number', minimum: 0, maximum: 10000 }
          }
        },

        // OTP Schemas
        OTPVerifyInput: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: { type: 'string', format: 'email', description: 'Email address used during registration' },
            otp: { type: 'string', pattern: '^[0-9]{6}$', description: '6-digit OTP code received via email' }
          }
        },
        OTPResendInput: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', description: 'Email address to resend OTP to' }
          }
        },
        OTPRegisterResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'OTP sent to your email. Please verify to complete registration.' },
            tempUserId: { type: 'string', description: 'Temporary user identifier for verification process' }
          }
        },
        OTPSuccessResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'New OTP sent to your email' }
          }
        },

        // Calendar and Calendar Events
        CalendarEvent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Team Sprint Planning' },
            description: { type: 'string', example: 'Weekly sprint planning meeting' },
            start_date: { type: 'string', format: 'date-time', example: '2024-01-15T10:00:00Z' },
            end_date: { type: 'string', format: 'date-time', example: '2024-01-15T11:00:00Z' },
            event_type: { type: 'string', enum: ['MEETING', 'DEADLINE', 'MILESTONE', 'REMINDER'], example: 'MEETING' },
            project_id: { type: 'string', format: 'uuid' },
            created_by: { type: 'string', format: 'uuid' },
            participants: { type: 'array', items: { type: 'string', format: 'uuid' } },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateCalendarEventInput: {
          type: 'object',
          required: ['title', 'start_date', 'end_date'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200 },
            description: { type: 'string', maxLength: 1000 },
            start_date: { type: 'string', format: 'date-time' },
            end_date: { type: 'string', format: 'date-time' },
            event_type: { type: 'string', enum: ['MEETING', 'DEADLINE', 'MILESTONE', 'REMINDER'] },
            project_id: { type: 'string', format: 'uuid' },
            participants: { type: 'array', items: { type: 'string', format: 'uuid' } }
          }
        },

        // Profile Management
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            avatar_url: { type: 'string', format: 'url', example: 'https://example.com/avatar.jpg' },
            phone: { type: 'string', example: '+1234567890' },
            timezone: { type: 'string', example: 'America/New_York' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'DEVELOPER'] },
            bio: { type: 'string', maxLength: 500, example: 'Senior software developer with 5+ years experience' },
            skills: { type: 'array', items: { type: 'string' }, example: ['JavaScript', 'React', 'Node.js'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        UpdateProfileInput: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 30 },
            first_name: { type: 'string', maxLength: 50 },
            last_name: { type: 'string', maxLength: 50 },
            phone: { type: 'string', maxLength: 20 },
            timezone: { type: 'string' },
            bio: { type: 'string', maxLength: 500 },
            skills: { type: 'array', items: { type: 'string' } }
          }
        },

        // Statistics and Analytics Schemas
        EstimationAccuracy: {
          type: 'object',
          properties: {
            total_estimates: { type: 'integer', example: 25 },
            completed_estimates: { type: 'integer', example: 20 },
            average_accuracy_percentage: { type: 'number', example: 85.5 },
            under_estimates: { type: 'integer', example: 8 },
            over_estimates: { type: 'integer', example: 12 },
            perfect_estimates: { type: 'integer', example: 0 },
            average_deviation_hours: { type: 'number', example: 1.2 }
          }
        },
        ProjectStats: {
          type: 'object',
          properties: {
            total_tasks: { type: 'integer', example: 45 },
            completed_tasks: { type: 'integer', example: 30 },
            in_progress_tasks: { type: 'integer', example: 10 },
            total_subtasks: { type: 'integer', example: 120 },
            total_hours_logged: { type: 'number', example: 320.5 },
            total_estimated_hours: { type: 'number', example: 400 },
            completion_percentage: { type: 'number', example: 66.7 }
          }
        },
        UserStats: {
          type: 'object',
          properties: {
            total_hours_logged: { type: 'number', example: 160.5 },
            hours_this_week: { type: 'number', example: 40 },
            hours_this_month: { type: 'number', example: 140 },
            total_tasks_worked: { type: 'integer', example: 15 },
            completed_tasks: { type: 'integer', example: 12 },
            average_hours_per_day: { type: 'number', example: 8.2 }
          }
        },

        // Team Management Schemas
        TeamMember: {
          type: 'object',
          properties: {
            user_id: { type: 'string', format: 'uuid' },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'DEVELOPER'], example: 'DEVELOPER' },
            project_id: { type: 'string', format: 'uuid' },
            assigned_at: { type: 'string', format: 'date-time' }
          }
        },
        AssignMembersInput: {
          type: 'object',
          required: ['userIds'],
          properties: {
            userIds: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              description: 'Array of user IDs to assign',
              example: ['user-1', 'user-2']
            }
          }
        },

        // File Management Schemas  
        File: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            filename: { type: 'string', example: 'document.pdf' },
            original_name: { type: 'string', example: 'Project Requirements.pdf' },
            mime_type: { type: 'string', example: 'application/pdf' },
            file_size: { type: 'integer', example: 1024000 },
            upload_path: { type: 'string', example: 'uploads/projects/uuid/document.pdf' },
            project_id: { type: 'string', format: 'uuid' },
            task_id: { type: 'string', format: 'uuid' },
            uploaded_by: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // Response Schemas
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 5 }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object', description: 'Response data (varies by endpoint)' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication and authorization endpoints' },
      { name: 'Projects', description: 'Project management operations' },
      { name: 'Tasks', description: 'Task management and assignment' },
      { name: 'Subtasks', description: 'Subtask creation, assignment, and tracking' },
      { name: 'WorkLogs', description: 'Work time logging and tracking' },
      { name: 'Estimates', description: 'Task and subtask estimation system' },
      { name: 'Teams', description: 'Team member management and assignment' },
      { name: 'Reports', description: 'Analytics and reporting endpoints' },
      { name: 'Files', description: 'File upload and management' },
      { name: 'Admin', description: 'Administrative functions and user management' },
      { name: 'Calendar', description: 'Calendar and scheduling features' },
      { name: 'Profile', description: 'User profile management' }
    ]
  },
  apis: [
    path.join(__dirname, '../src/routes/*.js'),
    path.join(__dirname, '../src/controllers/*.js')
  ]
};

module.exports = swaggerJSDoc(options);
