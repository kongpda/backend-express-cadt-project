const express = require("express");
const prisma = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Handle cleanup
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
