const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management API',
      version: '1.0.0',
      description: 'A comprehensive project management system API'
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
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: { message: { type: 'string' } }
        },
        AuthRegisterInput: {
          type: 'object',
          required: ['username', 'email', 'password', 'role'],
          properties: {
            username: { type: 'string', description: 'User display name' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            password: { type: 'string', minLength: 6, description: 'User password (min 6 characters)' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'DEVELOPER'],
              description: 'User role in the system'
            }
          }
        },
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
        AuthLoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User unique identifier' },
            username: { type: 'string', description: 'User display name' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'DEVELOPER'],
              description: 'User role in the system'
            },
            email_verified: { type: 'boolean', description: 'Whether email has been verified' },
            created_at: { type: 'string', format: 'date-time', description: 'Account creation timestamp' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT authentication token' },
            user: { $ref: '#/components/schemas/UserPublic' }
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
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../src/routes/*.js'),
    path.join(__dirname, '../src/controllers/*.js')
  ]
};

module.exports = swaggerJSDoc(options);
