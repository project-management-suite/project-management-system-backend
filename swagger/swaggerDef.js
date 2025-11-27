const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management API',
      version: '1.0.0'
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}` }],
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
          required: ['name','email','password'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            role: { type: 'string', description: 'Optional initial role' }
          }
        },
        AuthLoginInput: {
          type: 'object',
          required: ['email','password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/UserPublic' }
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
