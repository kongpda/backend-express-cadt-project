const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'User API Documentation',
            version: '1.0.0',
            description: 'API documentation for User Management',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
    },
    apis: ['./src/controllers/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);
module.exports = specs;
