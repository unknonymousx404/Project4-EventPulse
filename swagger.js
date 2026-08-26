const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventPulse API',
      version: '1.0.0',
      description: 'Backend API for Event Management Platform - EventPulse. Complete CRUD, Auth, Registrations, Announcements, Health.',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
      { url: 'https://your-app.vercel.app', description: 'Production server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
            role: { type: 'string', enum: ['attendee', 'admin'] },
          },
        },
        Event: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            city: { type: 'string' },
            venue: { type: 'string' },
            capacity: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
                example: { name: 'Sara Ahmed', email: 'sara@email.com', password: 'Password123' },
              },
            },
          },
          responses: {
            201: { description: 'User registered, returns token' },
            400: { description: 'Email already registered' },
            422: { description: 'Validation error' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } },
                example: { email: 'admin@eventpulse.com', password: 'Admin123!' },
              },
            },
          },
          responses: {
            200: { description: 'Login success, returns token' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/events': {
        get: {
          tags: ['Events'],
          summary: 'List events with filtering, pagination, sorting, search',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category ID' },
            { name: 'city', in: 'query', schema: { type: 'string' }, description: 'Filter by city' },
            { name: 'startDate', in: 'query', schema: { type: 'string' } },
            { name: 'endDate', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['date', 'registrations', 'createdAt'] } },
            { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: { 200: { description: 'List of events' } },
        },
        post: {
          tags: ['Events'],
          summary: 'Create event (admin only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Event' },
              },
            },
          },
          responses: {
            201: { description: 'Event created' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/api/events/{id}': {
        get: {
          tags: ['Events'],
          summary: 'Get single event by id',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Event details' }, 404: { description: 'Not found' } },
        },
        patch: {
          tags: ['Events'],
          summary: 'Update event (admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Event updated' } },
        },
        delete: {
          tags: ['Events'],
          summary: 'Delete event (admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Event deleted' } },
        },
      },
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: { 200: { description: 'Server is running' } },
        },
      },
    },
  },
  apis: ['./routes/*.js', './app.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
