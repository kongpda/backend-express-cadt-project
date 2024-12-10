const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CADT API Documentation',
            version: '1.0.0',
            description: 'API documentation for User and Event Management',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        tags: [
            {
                name: 'Users',
                description: 'User management endpoints'
            },
            {
                name: 'Events',
                description: 'Event management endpoints'
            }
        ]
    },
    apis: [
        './src/controllers/*.js',
        './src/routes/*.js'
    ],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
