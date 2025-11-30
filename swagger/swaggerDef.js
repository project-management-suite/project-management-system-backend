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
            username: { type: 'string', description: 'User display name', example: 'test_developer' },
            email: { type: 'string', format: 'email', description: 'User email address', example: 'testdeveloper@testapp.com' },
            password: { type: 'string', minLength: 6, description: 'User password (min 6 characters)', example: 'testpass123' },
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
            email: { type: 'string', format: 'email', example: 'testmanager@testapp.com' },
            password: { type: 'string', minLength: 6, example: 'testpass123' }
          }
        },
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User unique identifier', example: 'dev-uuid-123' },
            username: { type: 'string', description: 'User display name', example: 'test_developer' },
            email: { type: 'string', format: 'email', description: 'User email address', example: 'testdeveloper@testapp.com' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'DEVELOPER'],
              description: 'User role in the system',
              example: 'DEVELOPER'
            },
            email_verified: { type: 'boolean', description: 'Whether email has been verified', example: true },
            created_at: { type: 'string', format: 'date-time', description: 'Account creation timestamp', example: '2025-11-15T10:00:00Z' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            token: { type: 'string', description: 'JWT authentication token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/UserPublic' }
          }
        },
        OTPVerifyInput: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: { type: 'string', format: 'email', description: 'Email address used during registration', example: 'testdeveloper@testapp.com' },
            otp: { type: 'string', pattern: '^[0-9]{6}$', description: '6-digit OTP code received via email', example: '123456' }
          }
        },
        OTPResendInput: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', description: 'Email address to resend OTP to', example: 'testadmin@testapp.com' }
          }
        },
        OTPRegisterResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'OTP sent to your email. Please verify to complete registration.' },
            email: { type: 'string', example: 'testdeveloper@testapp.com' },
            tempUserId: { type: 'string', description: 'Temporary user identifier for verification process', example: 'temp-uuid-123' }
          }
        },
        OTPSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'New OTP sent to your email' },
            email: { type: 'string', example: 'testadmin@testapp.com' },
            expires_in: { type: 'string', example: '10 minutes' }
          }
        },

        // Project Schemas
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Project unique identifier', example: 'proj-uuid-123' },
            project_name: { type: 'string', description: 'Project name', example: 'Test Project API' },
            description: { type: 'string', description: 'Project description', example: 'A test project created by automated API testing script' },
            status: {
              type: 'string',
              enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
              description: 'Project status',
              example: 'IN_PROGRESS'
            },
            start_date: { type: 'string', format: 'date', description: 'Project start date', example: '2025-12-01' },
            end_date: { type: 'string', format: 'date', description: 'Project end date', example: '2025-12-31' },
            created_by: { type: 'string', format: 'uuid', description: 'Creator user ID', example: 'manager-uuid-456' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2025-12-01T09:00:00Z' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp', example: '2025-12-01T15:30:00Z' },
            task_count: { type: 'integer', description: 'Number of tasks in project', example: 12 },
            completed_tasks: { type: 'integer', description: 'Number of completed tasks', example: 8 },
            team_members: { type: 'integer', description: 'Number of team members', example: 3 }
          }
        },
        CreateProjectInput: {
          type: 'object',
          required: ['project_name'],
          properties: {
            project_name: { type: 'string', minLength: 3, maxLength: 100, example: 'Test Project API' },
            description: { type: 'string', maxLength: 1000, example: 'A test project created by automated API testing script' },
            start_date: { type: 'string', format: 'date', example: '2025-12-01' },
            end_date: { type: 'string', format: 'date', example: '2025-12-31' }
          }
        },
        UpdateProjectInput: {
          type: 'object',
          properties: {
            project_name: { type: 'string', minLength: 3, maxLength: 100, example: 'Updated Test Project API' },
            description: { type: 'string', maxLength: 1000, example: 'Updated description for test project' },
            status: { type: 'string', enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'], example: 'COMPLETED' },
            end_date: { type: 'string', format: 'date', example: '2025-12-15' }
          }
        },
        ProjectDashboard: {
          type: 'object',
          properties: {
            total_projects: { type: 'integer', example: 3 },
            active_projects: { type: 'integer', example: 2 },
            completed_projects: { type: 'integer', example: 1 },
            total_tasks: { type: 'integer', example: 12 },
            completed_tasks: { type: 'integer', example: 8 },
            overdue_tasks: { type: 'integer', example: 1 },
            team_productivity: {
              type: 'object',
              properties: {
                this_week: { type: 'number', example: 85.2 },
                this_month: { type: 'number', example: 78.5 }
              }
            }
          }
        },

        // Task Schemas
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Task unique identifier', example: 'task-uuid-123' },
            title: { type: 'string', description: 'Task title', example: 'Test Task API' },
            description: { type: 'string', description: 'Task description', example: 'A test task created by automated API testing script' },
            project_id: { type: 'string', format: 'uuid', description: 'Associated project ID', example: 'proj-uuid-456' },
            assigned_to: { type: 'string', format: 'uuid', description: 'Assigned user ID', example: 'dev-uuid-123' },
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
            start_date: { type: 'string', format: 'date', description: 'Task start date', example: '2025-12-01' },
            end_date: { type: 'string', format: 'date', description: 'Task end date', example: '2025-12-15' },
            due_date: { type: 'string', format: 'date-time', description: 'Task due date', example: '2025-12-15T23:59:59Z' },
            estimated_hours: { type: 'number', description: 'Estimated completion hours', example: 16 },
            actual_hours: { type: 'number', description: 'Actual hours spent', example: 8.5 },
            completion_percentage: { type: 'number', description: 'Task completion percentage', example: 65 },
            created_at: { type: 'string', format: 'date-time', example: '2025-12-01T10:00:00Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2025-12-01T16:00:00Z' }
          }
        },
        CreateTaskInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Test Task API' },
            description: { type: 'string', maxLength: 1000, example: 'A test task created by automated API testing script' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
            start_date: { type: 'string', format: 'date', example: '2025-12-01' },
            end_date: { type: 'string', format: 'date', example: '2025-12-15' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'], example: 'TODO' },
            estimated_hours: { type: 'number', minimum: 0.1, maximum: 1000, example: 16 },
            assigned_to: { type: 'string', format: 'uuid', example: 'dev-uuid-123' }
          }
        },
        UpdateTaskInput: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Updated Test Task API' },
            description: { type: 'string', maxLength: 1000 },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'URGENT' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'], example: 'IN_PROGRESS' },
            due_date: { type: 'string', format: 'date-time' },
            estimated_hours: { type: 'number', minimum: 0.1, maximum: 1000 },
            actual_hours: { type: 'number', minimum: 0, maximum: 10000, example: 12.5 },
            completion_percentage: { type: 'number', minimum: 0, maximum: 100, example: 75 }
          }
        },
        TaskAssignInput: {
          type: 'object',
          required: ['developer_id'],
          properties: {
            developer_id: { type: 'string', format: 'uuid', example: 'dev-uuid-123' }
          }
        },

        // Subtask Schemas
        Subtask: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Subtask unique identifier', example: 'subtask-uuid-789' },
            title: { type: 'string', description: 'Subtask title', example: 'Test Subtask API' },
            description: { type: 'string', description: 'Subtask description', example: 'A test subtask created by automated API testing script' },
            task_id: { type: 'string', format: 'uuid', description: 'Parent task ID', example: 'task-uuid-123' },
            assigned_to: { type: 'string', format: 'uuid', description: 'Assigned user ID', example: 'dev-uuid-123' },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              example: 'MEDIUM'
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'],
              example: 'IN_PROGRESS'
            },
            start_date: { type: 'string', format: 'date', example: '2025-12-02' },
            end_date: { type: 'string', format: 'date', example: '2025-12-05' },
            due_date: { type: 'string', format: 'date-time', example: '2025-12-05T23:59:59Z' },
            estimated_hours: { type: 'number', example: 4.5 },
            actual_hours: { type: 'number', example: 2.0 },
            completion_percentage: { type: 'number', example: 40 },
            created_by: { type: 'string', format: 'uuid', example: 'manager-uuid-456' },
            created_at: { type: 'string', format: 'date-time', example: '2025-12-01T14:30:00Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2025-12-01T17:00:00Z' }
          }
        },
        CreateSubtaskInput: {
          type: 'object',
          required: ['title', 'parent_task_id'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Test Subtask API' },
            description: { type: 'string', maxLength: 1000, example: 'A test subtask created by automated API testing script' },
            parent_task_id: { type: 'string', format: 'uuid', example: 'task-uuid-123' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'MEDIUM' },
            estimated_hours: { type: 'number', minimum: 0.1, maximum: 1000, example: 4.5 },
            start_date: { type: 'string', format: 'date', example: '2025-12-02' },
            end_date: { type: 'string', format: 'date', example: '2025-12-05' }
          }
        },
        UpdateSubtaskInput: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Updated Test Subtask API' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'], example: 'IN_PROGRESS' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'HIGH' },
            estimated_hours: { type: 'number', minimum: 0.1, maximum: 1000, example: 6.0 },
            completion_percentage: { type: 'number', minimum: 0, maximum: 100, example: 60 }
          }
        },
        SubtaskAssignInput: {
          type: 'object',
          required: ['user_id'],
          properties: {
            user_id: { type: 'string', format: 'uuid', example: 'dev-uuid-123' }
          }
        },
        SubtaskStats: {
          type: 'object',
          properties: {
            subtask_id: { type: 'string', example: 'subtask-uuid-789' },
            title: { type: 'string', example: 'Test Subtask API' },
            status: { type: 'string', example: 'IN_PROGRESS' },
            time_tracking: {
              type: 'object',
              properties: {
                estimated_hours: { type: 'number', example: 8.5 },
                actual_hours: { type: 'number', example: 4.0 },
                remaining_hours: { type: 'number', example: 4.5 },
                completion_percentage: { type: 'number', example: 47 }
              }
            },
            work_logs: {
              type: 'object',
              properties: {
                total_entries: { type: 'integer', example: 3 },
                total_hours: { type: 'number', example: 4.0 },
                last_logged: { type: 'string', format: 'date-time', example: '2025-12-02T16:30:00Z' }
              }
            },
            estimates: {
              type: 'object',
              properties: {
                total_estimates: { type: 'integer', example: 2 },
                accuracy: { type: 'number', example: 85.5 },
                latest_estimate: { type: 'number', example: 8.5 }
              }
            }
          }
        },

        // Work Log Schemas
        WorkLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Work log unique identifier', example: 'log-uuid-456' },
            user_id: { type: 'string', format: 'uuid', description: 'User who logged the work', example: 'dev-uuid-123' },
            task_id: { type: 'string', format: 'uuid', description: 'Associated task ID (optional)', example: 'task-uuid-123' },
            subtask_id: { type: 'string', format: 'uuid', description: 'Associated subtask ID (optional)', example: 'subtask-uuid-789' },
            hours_logged: { type: 'number', description: 'Hours worked', example: 2.5 },
            work_date: { type: 'string', format: 'date', description: 'Date work was performed', example: '2025-12-02' },
            description: { type: 'string', description: 'Work description', example: 'Initial implementation and testing of task functionality' },
            log_type: {
              type: 'string',
              enum: ['DEVELOPMENT', 'TESTING', 'REVIEW', 'DOCUMENTATION', 'MEETING', 'RESEARCH', 'BUG_FIX', 'OTHER'],
              description: 'Type of work performed',
              example: 'DEVELOPMENT'
            },
            created_at: { type: 'string', format: 'date-time', example: '2025-12-02T18:30:00Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2025-12-02T20:00:00Z' }
          }
        },
        CreateWorkLogInput: {
          type: 'object',
          required: ['hours_logged', 'work_date'],
          properties: {
            hours_logged: { type: 'number', minimum: 0.1, maximum: 24, example: 2.5 },
            work_date: { type: 'string', format: 'date', example: '2025-12-02' },
            task_id: { type: 'string', format: 'uuid', example: 'task-uuid-123' },
            subtask_id: { type: 'string', format: 'uuid', example: 'subtask-uuid-789' },
            description: { type: 'string', maxLength: 1000, example: 'Initial implementation and testing of task functionality' },
            log_type: {
              type: 'string',
              enum: ['DEVELOPMENT', 'TESTING', 'REVIEW', 'DOCUMENTATION', 'MEETING', 'RESEARCH', 'BUG_FIX', 'OTHER'],
              example: 'DEVELOPMENT'
            }
          }
        },
        BulkWorkLogInput: {
          type: 'object',
          required: ['workLogs'],
          properties: {
            workLogs: {
              type: 'array',
              items: { $ref: '#/components/schemas/CreateWorkLogInput' },
              example: [
                {
                  task_id: 'task-uuid-123',
                  hours_logged: 1.5,
                  work_date: '2025-12-03',
                  description: 'Code review and testing',
                  log_type: 'REVIEW'
                },
                {
                  task_id: 'task-uuid-123',
                  hours_logged: 2.0,
                  work_date: '2025-12-04',
                  description: 'Bug fixes and documentation',
                  log_type: 'BUG_FIX'
                }
              ]
            }
          }
        },
        WorkLogStats: {
          type: 'object',
          properties: {
            total_hours_logged: { type: 'number', example: 45.5 },
            hours_this_week: { type: 'number', example: 12.5 },
            hours_this_month: { type: 'number', example: 45.5 },
            total_work_days: { type: 'integer', example: 8 },
            average_hours_per_day: { type: 'number', example: 5.7 },
            most_productive_day: { type: 'string', example: 'Tuesday' },
            breakdown_by_type: {
              type: 'object',
              properties: {
                DEVELOPMENT: { type: 'number', example: 32.5 },
                TESTING: { type: 'number', example: 8.0 },
                REVIEW: { type: 'number', example: 5.0 }
              }
            }
          }
        },

        // Estimate Schemas
        TaskEstimate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Estimate unique identifier', example: 'estimate-uuid-789' },
            estimator_id: { type: 'string', format: 'uuid', description: 'User who made the estimate', example: 'dev-uuid-123' },
            task_id: { type: 'string', format: 'uuid', description: 'Associated task ID (optional)', example: 'task-uuid-123' },
            subtask_id: { type: 'string', format: 'uuid', description: 'Associated subtask ID (optional)', example: 'subtask-uuid-456' },
            estimated_hours: { type: 'number', description: 'Estimated completion hours', example: 16.0 },
            actual_hours: { type: 'number', description: 'Actual hours (filled when completed)', example: 12.5 },
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
            estimate_type: {
              type: 'string',
              enum: ['INITIAL', 'REVISED', 'FINAL'],
              description: 'Type of estimate',
              example: 'INITIAL'
            },
            accuracy_percentage: { type: 'number', description: 'Accuracy when completed', example: 78.1 },
            notes: { type: 'string', description: 'Additional estimation notes', example: 'Initial estimate based on requirements analysis' },
            created_at: { type: 'string', format: 'date-time', example: '2025-12-01T10:15:00Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2025-12-01T15:00:00Z' }
          }
        },
        CreateEstimateInput: {
          type: 'object',
          required: ['estimated_hours'],
          properties: {
            estimated_hours: { type: 'number', minimum: 0.1, maximum: 1000, example: 16.0 },
            task_id: { type: 'string', format: 'uuid', example: 'task-uuid-123' },
            subtask_id: { type: 'string', format: 'uuid', example: 'subtask-uuid-456' },
            complexity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'], example: 'MEDIUM' },
            confidence_level: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            estimate_type: { type: 'string', enum: ['INITIAL', 'REVISED', 'FINAL'], example: 'INITIAL' },
            notes: { type: 'string', maxLength: 1000, example: 'Initial estimate based on requirements analysis' }
          }
        },
        EstimationAccuracy: {
          type: 'object',
          properties: {
            total_estimates: { type: 'integer', example: 25 },
            completed_estimates: { type: 'integer', example: 20 },
            average_accuracy_percentage: { type: 'number', example: 85.5 },
            under_estimates: { type: 'integer', example: 8 },
            over_estimates: { type: 'integer', example: 12 },
            perfect_estimates: { type: 'integer', example: 0 },
            average_deviation_hours: { type: 'number', example: 1.2 },
            improvement_trend: { type: 'string', example: 'IMPROVING' }
          }
        },
        EstimationTrends: {
          type: 'object',
          properties: {
            overall_accuracy: {
              type: 'object',
              properties: {
                current_period: { type: 'number', example: 85.5 },
                previous_period: { type: 'number', example: 78.2 },
                improvement: { type: 'number', example: 7.3 }
              }
            },
            complexity_patterns: {
              type: 'object',
              properties: {
                LOW: { type: 'object', properties: { accuracy: { type: 'number', example: 92.5 }, count: { type: 'integer', example: 8 } } },
                MEDIUM: { type: 'object', properties: { accuracy: { type: 'number', example: 85.0 }, count: { type: 'integer', example: 12 } } },
                HIGH: { type: 'object', properties: { accuracy: { type: 'number', example: 75.2 }, count: { type: 'integer', example: 7 } } }
              }
            }
          }
        },



        // Calendar and Events Schemas
        Holiday: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'holiday-uuid-123' },
            name: { type: 'string', example: 'Test Holiday' },
            date: { type: 'string', format: 'date', example: '2025-12-25' },
            type: { type: 'string', enum: ['NATIONAL', 'COMPANY', 'CUSTOM'], example: 'CUSTOM' },
            description: { type: 'string', example: 'A test holiday created by automated API testing script' },
            is_working_day: { type: 'boolean', example: false }
          }
        },
        CreateHolidayInput: {
          type: 'object',
          required: ['name', 'date'],
          properties: {
            name: { type: 'string', example: 'Company Anniversary' },
            date: { type: 'string', format: 'date', example: '2025-12-15' },
            description: { type: 'string', example: 'Company founding anniversary celebration' },
            type: { type: 'string', enum: ['NATIONAL', 'COMPANY', 'CUSTOM'], example: 'COMPANY' },
            is_working_day: { type: 'boolean', example: false }
          }
        },
        CalendarEvent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'event-uuid-123' },
            title: { type: 'string', example: 'Team Sprint Planning' },
            description: { type: 'string', example: 'Weekly sprint planning meeting' },
            start_date: { type: 'string', format: 'date-time', example: '2025-12-01T10:00:00Z' },
            end_date: { type: 'string', format: 'date-time', example: '2025-12-01T11:00:00Z' },
            event_type: { type: 'string', enum: ['MEETING', 'DEADLINE', 'MILESTONE', 'REMINDER'], example: 'MEETING' },
            project_id: { type: 'string', format: 'uuid', example: 'proj-uuid-123' },
            created_by: { type: 'string', format: 'uuid', example: 'manager-uuid-456' },
            participants: { type: 'array', items: { type: 'string', format: 'uuid' }, example: ['dev-uuid-123', 'dev-uuid-456'] },
            created_at: { type: 'string', format: 'date-time', example: '2025-12-01T09:00:00Z' }
          }
        },
        CreateReminderInput: {
          type: 'object',
          required: ['task_id', 'reminder_date'],
          properties: {
            task_id: { type: 'string', format: 'uuid', example: 'task-uuid-123' },
            reminder_date: { type: 'string', format: 'date-time', example: '2025-12-14T09:00:00Z' },
            reminder_type: { type: 'string', enum: ['EMAIL', 'NOTIFICATION', 'SMS'], example: 'EMAIL' },
            message: { type: 'string', example: 'Task deadline reminder' }
          }
        },

        // Profile Management Schemas
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'dev-uuid-123' },
            username: { type: 'string', example: 'test_developer' },
            email: { type: 'string', format: 'email', example: 'testdeveloper@testapp.com' },
            first_name: { type: 'string', example: 'Test' },
            last_name: { type: 'string', example: 'Developer' },
            profile_photo_url: { type: 'string', format: 'url', example: 'https://storage.supabase.co/...' },
            phone: { type: 'string', example: '+1234567890' },
            timezone: { type: 'string', example: 'America/New_York' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'DEVELOPER'], example: 'DEVELOPER' },
            bio: { type: 'string', maxLength: 500, example: 'Experienced full-stack developer with 5+ years experience' },
            skills: { type: 'array', items: { type: 'string' }, example: ['JavaScript', 'React', 'Node.js'] },
            statistics: {
              type: 'object',
              properties: {
                total_tasks_assigned: { type: 'integer', example: 25 },
                completed_tasks: { type: 'integer', example: 18 },
                total_hours_logged: { type: 'number', example: 125.5 },
                average_hours_per_day: { type: 'number', example: 6.3 },
                projects_involved: { type: 'integer', example: 3 }
              }
            },
            created_at: { type: 'string', format: 'date-time', example: '2025-11-15T10:00:00Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2025-12-01T15:00:00Z' },
            last_active: { type: 'string', format: 'date-time', example: '2025-12-01T18:00:00Z' }
          }
        },
        UpdateProfileInput: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 30, example: 'updated_developer' },
            email: { type: 'string', format: 'email', example: 'updated.developer@testapp.com' },
            first_name: { type: 'string', maxLength: 50, example: 'Updated' },
            last_name: { type: 'string', maxLength: 50, example: 'Developer' },
            phone: { type: 'string', maxLength: 20, example: '+1987654321' },
            timezone: { type: 'string', example: 'America/New_York' },
            bio: { type: 'string', maxLength: 500, example: 'Experienced full-stack developer' },
            skills: { type: 'array', items: { type: 'string' }, example: ['JavaScript', 'Python', 'React', 'Node.js'] }
          }
        },

        // Team Management Schemas
        Team: {
          type: 'object',
          properties: {
            team_id: { type: 'string', format: 'uuid', example: 'team-uuid-123' },
            team_name: { type: 'string', example: 'Test Development Team' },
            description: { type: 'string', example: 'A test team created by automated API testing script' },
            manager: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid', example: 'manager-uuid-456' },
                username: { type: 'string', example: 'test_manager' },
                email: { type: 'string', format: 'email', example: 'testmanager@testapp.com' }
              }
            },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid', example: 'dev-uuid-123' },
                  username: { type: 'string', example: 'test_developer' },
                  role: { type: 'string', example: 'DEVELOPER' },
                  join_date: { type: 'string', format: 'date-time', example: '2025-12-01T10:00:00Z' },
                  active_tasks: { type: 'integer', example: 3 }
                }
              }
            },
            statistics: {
              type: 'object',
              properties: {
                total_members: { type: 'integer', example: 3 },
                active_projects: { type: 'integer', example: 2 },
                completed_projects: { type: 'integer', example: 5 },
                total_hours_logged: { type: 'number', example: 245.5 }
              }
            },
            created_at: { type: 'string', format: 'date-time', example: '2025-12-01T09:00:00Z' }
          }
        },
        CreateTeamInput: {
          type: 'object',
          required: ['team_name'],
          properties: {
            team_name: { type: 'string', example: 'Test Development Team' },
            description: { type: 'string', example: 'A test team created by automated API testing script' }
          }
        },
        TeamMemberInput: {
          type: 'object',
          required: ['user_id'],
          properties: {
            user_id: { type: 'string', format: 'uuid', example: 'dev-uuid-789' },
            role_in_team: { type: 'string', example: 'DEVELOPER' }
          }
        },
        TeamStats: {
          type: 'object',
          properties: {
            team_id: { type: 'string', example: 'team-uuid-123' },
            team_name: { type: 'string', example: 'Test Development Team' },
            performance: {
              type: 'object',
              properties: {
                productivity_score: { type: 'number', example: 87.5 },
                total_hours_logged: { type: 'number', example: 245.5 },
                projects_completed: { type: 'integer', example: 5 },
                active_projects: { type: 'integer', example: 2 },
                tasks_completed: { type: 'integer', example: 48 },
                average_task_completion_time: { type: 'number', example: 3.2 }
              }
            }
          }
        },

        // Admin Dashboard Schemas
        AdminDashboard: {
          type: 'object',
          properties: {
            users: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 3 },
                active: { type: 'integer', example: 3 },
                admins: { type: 'integer', example: 1 },
                managers: { type: 'integer', example: 1 },
                developers: { type: 'integer', example: 1 },
                new_this_month: { type: 'integer', example: 0 }
              }
            },
            projects: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 3 },
                active: { type: 'integer', example: 2 },
                completed: { type: 'integer', example: 1 },
                overdue: { type: 'integer', example: 0 }
              }
            },
            tasks: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 12 },
                completed: { type: 'integer', example: 8 },
                in_progress: { type: 'integer', example: 2 },
                todo: { type: 'integer', example: 2 },
                overdue: { type: 'integer', example: 1 }
              }
            },
            system_health: {
              type: 'object',
              properties: {
                database_status: { type: 'string', example: 'healthy' },
                api_response_time: { type: 'string', example: '45ms' },
                storage_used: { type: 'string', example: '15.2MB' }
              }
            }
          }
        },
        AllUsersResponse: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid', example: 'admin-uuid-123' },
                  username: { type: 'string', example: 'test_admin' },
                  email: { type: 'string', format: 'email', example: 'testadmin@testapp.com' },
                  role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'DEVELOPER'], example: 'ADMIN' },
                  email_verified: { type: 'boolean', example: true },
                  created_at: { type: 'string', format: 'date-time', example: '2025-11-15T10:00:00Z' },
                  last_login: { type: 'string', format: 'date-time', example: '2025-12-01T09:00:00Z' }
                }
              }
            },
            total_count: { type: 'integer', example: 3 },
            roles_breakdown: {
              type: 'object',
              properties: {
                ADMIN: { type: 'integer', example: 1 },
                MANAGER: { type: 'integer', example: 1 },
                DEVELOPER: { type: 'integer', example: 1 }
              }
            }
          }
        },
        UpdateUserRoleInput: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'DEVELOPER'], example: 'MANAGER' }
          }
        },

        // Analytics and Reporting Schemas
        AnalyticsDashboard: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                totalProjects: { type: 'integer', example: 3 },
                totalTasks: { type: 'integer', example: 12 },
                completedTasks: { type: 'integer', example: 8 },
                overdueTasks: { type: 'integer', example: 1 },
                activeUsers: { type: 'integer', example: 3 }
              }
            },
            thisMonth: {
              type: 'object',
              properties: {
                tasksCompleted: { type: 'integer', example: 8 },
                hoursLogged: { type: 'number', example: 45.5 },
                projectsDelivered: { type: 'integer', example: 1 }
              }
            },
            statusDistribution: {
              type: 'object',
              properties: {
                TODO: { type: 'integer', example: 2 },
                IN_PROGRESS: { type: 'integer', example: 2 },
                IN_REVIEW: { type: 'integer', example: 0 },
                DONE: { type: 'integer', example: 8 },
                BLOCKED: { type: 'integer', example: 0 }
              }
            },
            productivity: {
              type: 'object',
              properties: {
                estimationAccuracy: { type: 'number', example: 78.5 },
                onTimeDelivery: { type: 'number', example: 85.0 },
                teamVelocity: { type: 'number', example: 90.2 }
              }
            }
          }
        },
        CustomReportInput: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date', example: '2025-11-01' },
            endDate: { type: 'string', format: 'date', example: '2025-12-31' },
            projectId: { type: 'string', format: 'uuid', example: 'proj-uuid-123' },
            userId: { type: 'string', format: 'uuid', example: 'dev-uuid-456' }
          }
        },
        PDFExportInput: {
          type: 'object',
          required: ['reportType'],
          properties: {
            reportType: { type: 'string', enum: ['weekly', 'monthly', 'custom'], example: 'weekly' },
            projectId: { type: 'string', format: 'uuid', example: 'proj-uuid-123' },
            startDate: { type: 'string', format: 'date', example: '2025-12-01' },
            includeCharts: { type: 'boolean', example: true },
            includeDetails: { type: 'boolean', example: true }
          }
        },
        // Statistics and Analytics Schemas
        ProjectStats: {
          type: 'object',
          properties: {
            total_tasks: { type: 'integer', example: 12 },
            completed_tasks: { type: 'integer', example: 8 },
            in_progress_tasks: { type: 'integer', example: 2 },
            total_subtasks: { type: 'integer', example: 25 },
            total_hours_logged: { type: 'number', example: 125.5 },
            total_estimated_hours: { type: 'number', example: 180 },
            completion_percentage: { type: 'number', example: 80.0 },
            team_members: { type: 'integer', example: 3 },
            overdue_tasks: { type: 'integer', example: 1 }
          }
        },
        UserStats: {
          type: 'object',
          properties: {
            total_hours_logged: { type: 'number', example: 45.5 },
            hours_this_week: { type: 'number', example: 12.5 },
            hours_this_month: { type: 'number', example: 45.5 },
            total_work_days: { type: 'integer', example: 8 },
            average_hours_per_day: { type: 'number', example: 5.7 },
            total_tasks_worked: { type: 'integer', example: 15 },
            completed_tasks: { type: 'integer', example: 12 },
            most_productive_day: { type: 'string', example: 'Tuesday' },
            breakdown_by_type: {
              type: 'object',
              properties: {
                DEVELOPMENT: { type: 'number', example: 32.5 },
                TESTING: { type: 'number', example: 8.0 },
                REVIEW: { type: 'number', example: 5.0 }
              }
            }
          }
        },

        // Admin Dashboard Schemas
        AdminDashboard: {
          type: 'object',
          properties: {
            users: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 3 },
                active: { type: 'integer', example: 3 },
                admins: { type: 'integer', example: 1 },
                managers: { type: 'integer', example: 1 },
                developers: { type: 'integer', example: 1 },
                new_this_month: { type: 'integer', example: 0 }
              }
            },
            projects: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 3 },
                active: { type: 'integer', example: 2 },
                completed: { type: 'integer', example: 1 },
                overdue: { type: 'integer', example: 0 }
              }
            },
            tasks: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 12 },
                completed: { type: 'integer', example: 8 },
                in_progress: { type: 'integer', example: 2 },
                todo: { type: 'integer', example: 2 },
                overdue: { type: 'integer', example: 1 }
              }
            },
            system_health: {
              type: 'object',
              properties: {
                database_status: { type: 'string', example: 'healthy' },
                api_response_time: { type: 'string', example: '45ms' },
                storage_used: { type: 'string', example: '15.2MB' }
              }
            }
          }
        },
        AllUsersResponse: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid', example: 'admin-uuid-123' },
                  username: { type: 'string', example: 'test_admin' },
                  email: { type: 'string', format: 'email', example: 'testadmin@testapp.com' },
                  role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'DEVELOPER'], example: 'ADMIN' },
                  email_verified: { type: 'boolean', example: true },
                  created_at: { type: 'string', format: 'date-time', example: '2025-11-15T10:00:00Z' },
                  last_login: { type: 'string', format: 'date-time', example: '2025-12-01T09:00:00Z' }
                }
              }
            },
            total_count: { type: 'integer', example: 3 },
            roles_breakdown: {
              type: 'object',
              properties: {
                ADMIN: { type: 'integer', example: 1 },
                MANAGER: { type: 'integer', example: 1 },
                DEVELOPER: { type: 'integer', example: 1 }
              }
            }
          }
        },
        UpdateUserRoleInput: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'DEVELOPER'], example: 'MANAGER' }
          }
        },

        // Analytics and Reporting Schemas
        AnalyticsDashboard: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                totalProjects: { type: 'integer', example: 3 },
                totalTasks: { type: 'integer', example: 12 },
                completedTasks: { type: 'integer', example: 8 },
                overdueTasks: { type: 'integer', example: 1 },
                activeUsers: { type: 'integer', example: 3 }
              }
            },
            thisMonth: {
              type: 'object',
              properties: {
                tasksCompleted: { type: 'integer', example: 8 },
                hoursLogged: { type: 'number', example: 45.5 },
                projectsDelivered: { type: 'integer', example: 1 }
              }
            },
            statusDistribution: {
              type: 'object',
              properties: {
                TODO: { type: 'integer', example: 2 },
                IN_PROGRESS: { type: 'integer', example: 2 },
                IN_REVIEW: { type: 'integer', example: 0 },
                DONE: { type: 'integer', example: 8 },
                BLOCKED: { type: 'integer', example: 0 }
              }
            },
            productivity: {
              type: 'object',
              properties: {
                estimationAccuracy: { type: 'number', example: 78.5 },
                onTimeDelivery: { type: 'number', example: 85.0 },
                teamVelocity: { type: 'number', example: 90.2 }
              }
            }
          }
        },
        CustomReportInput: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date', example: '2025-11-01' },
            endDate: { type: 'string', format: 'date', example: '2025-12-31' },
            projectId: { type: 'string', format: 'uuid', example: 'proj-uuid-123' },
            userId: { type: 'string', format: 'uuid', example: 'dev-uuid-456' }
          }
        },
        PDFExportInput: {
          type: 'object',
          required: ['reportType'],
          properties: {
            reportType: { type: 'string', enum: ['weekly', 'monthly', 'custom'], example: 'weekly' },
            projectId: { type: 'string', format: 'uuid', example: 'proj-uuid-123' },
            startDate: { type: 'string', format: 'date', example: '2025-12-01' },
            includeCharts: { type: 'boolean', example: true },
            includeDetails: { type: 'boolean', example: true }
          }
        },

        // Team Management Schemas
        Team: {
          type: 'object',
          properties: {
            team_id: { type: 'string', format: 'uuid', example: 'team-uuid-123' },
            team_name: { type: 'string', example: 'Test Development Team' },
            description: { type: 'string', example: 'A test team created by automated API testing script' },
            manager: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid', example: 'manager-uuid-456' },
                username: { type: 'string', example: 'test_manager' },
                email: { type: 'string', format: 'email', example: 'testmanager@testapp.com' }
              }
            },
            members: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid', example: 'dev-uuid-123' },
                  username: { type: 'string', example: 'test_developer' },
                  role: { type: 'string', example: 'DEVELOPER' },
                  join_date: { type: 'string', format: 'date-time', example: '2025-12-01T10:00:00Z' },
                  active_tasks: { type: 'integer', example: 3 }
                }
              }
            },
            statistics: {
              type: 'object',
              properties: {
                total_members: { type: 'integer', example: 3 },
                active_projects: { type: 'integer', example: 2 },
                completed_projects: { type: 'integer', example: 5 },
                total_hours_logged: { type: 'number', example: 245.5 }
              }
            },
            created_at: { type: 'string', format: 'date-time', example: '2025-12-01T09:00:00Z' }
          }
        },
        CreateTeamInput: {
          type: 'object',
          required: ['team_name'],
          properties: {
            team_name: { type: 'string', example: 'Test Development Team' },
            description: { type: 'string', example: 'A test team created by automated API testing script' }
          }
        },
        TeamMemberInput: {
          type: 'object',
          required: ['user_id'],
          properties: {
            user_id: { type: 'string', format: 'uuid', example: 'dev-uuid-789' },
            role_in_team: { type: 'string', example: 'DEVELOPER' }
          }
        },
        TeamStats: {
          type: 'object',
          properties: {
            team_id: { type: 'string', example: 'team-uuid-123' },
            team_name: { type: 'string', example: 'Test Development Team' },
            performance: {
              type: 'object',
              properties: {
                productivity_score: { type: 'number', example: 87.5 },
                total_hours_logged: { type: 'number', example: 245.5 },
                projects_completed: { type: 'integer', example: 5 },
                active_projects: { type: 'integer', example: 2 },
                tasks_completed: { type: 'integer', example: 48 },
                average_task_completion_time: { type: 'number', example: 3.2 }
              }
            }
          }
        },

        // Team Member Management
        TeamMember: {
          type: 'object',
          properties: {
            user_id: { type: 'string', format: 'uuid', example: 'dev-uuid-123' },
            username: { type: 'string', example: 'test_developer' },
            email: { type: 'string', format: 'email', example: 'testdeveloper@testapp.com' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'DEVELOPER'], example: 'DEVELOPER' },
            project_id: { type: 'string', format: 'uuid', example: 'proj-uuid-123' },
            assigned_at: { type: 'string', format: 'date-time', example: '2025-12-01T11:00:00Z' }
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
              example: ['dev-uuid-123', 'dev-uuid-456']
            }
          }
        },

        // File Management Schemas  
        File: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'file-uuid-123' },
            filename: { type: 'string', example: 'test-document.txt' },
            original_name: { type: 'string', example: 'test-document.txt' },
            mime_type: { type: 'string', example: 'text/plain' },
            file_size: { type: 'integer', example: 1024 },
            upload_path: { type: 'string', example: 'uploads/projects/uuid/test-document.txt' },
            project: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid', example: 'proj-uuid-456' },
                project_name: { type: 'string', example: 'Test Project API' }
              }
            },
            task: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid', example: 'task-uuid-789' },
                title: { type: 'string', example: 'Test Task API' }
              }
            },
            uploaded_by: {
              type: 'object',
              properties: {
                username: { type: 'string', example: 'test_manager' },
                email: { type: 'string', format: 'email', example: 'testmanager@testapp.com' }
              }
            },
            uploaded_at: { type: 'string', format: 'date-time', example: '2025-12-01T15:00:00Z' }
          }
        },
        FileStats: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'file-uuid-123' },
            filename: { type: 'string', example: 'technical-specification.md' },
            file_size: { type: 'integer', example: 15360 },
            mime_type: { type: 'string', example: 'text/markdown' },
            download_count: { type: 'integer', example: 8 },
            last_downloaded: { type: 'string', format: 'date-time', example: '2025-12-01T16:45:00Z' },
            virus_scan_status: { type: 'string', example: 'clean' },
            checksum: { type: 'string', example: 'sha256:a1b2c3d4e5f6...' },
            metadata: {
              type: 'object',
              properties: {
                width: { type: 'integer', nullable: true },
                height: { type: 'integer', nullable: true },
                duration: { type: 'number', nullable: true },
                pages: { type: 'integer', nullable: true }
              }
            }
          }
        },

        // Updated Statistics Schemas with test-appropriate data
        ProjectStats: {
          type: 'object',
          properties: {
            total_tasks: { type: 'integer', example: 12 },
            completed_tasks: { type: 'integer', example: 8 },
            in_progress_tasks: { type: 'integer', example: 2 },
            total_subtasks: { type: 'integer', example: 25 },
            total_hours_logged: { type: 'number', example: 125.5 },
            total_estimated_hours: { type: 'number', example: 180 },
            completion_percentage: { type: 'number', example: 80.0 },
            team_members: { type: 'integer', example: 3 },
            overdue_tasks: { type: 'integer', example: 1 }
          }
        },
        UserStats: {
          type: 'object',
          properties: {
            total_hours_logged: { type: 'number', example: 45.5 },
            hours_this_week: { type: 'number', example: 12.5 },
            hours_this_month: { type: 'number', example: 45.5 },
            total_work_days: { type: 'integer', example: 8 },
            average_hours_per_day: { type: 'number', example: 5.7 },
            total_tasks_worked: { type: 'integer', example: 15 },
            completed_tasks: { type: 'integer', example: 12 },
            most_productive_day: { type: 'string', example: 'Tuesday' },
            breakdown_by_type: {
              type: 'object',
              properties: {
                DEVELOPMENT: { type: 'number', example: 32.5 },
                TESTING: { type: 'number', example: 8.0 },
                REVIEW: { type: 'number', example: 5.0 }
              }
            }
          }
        },

        // Team Member Management
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

        // Response Schemas with comprehensive examples
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
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
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object', description: 'Response data (varies by endpoint)' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            error: { type: 'string', example: 'Detailed error message' },
            code: { type: 'string', example: 'ERROR_CODE' }
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
