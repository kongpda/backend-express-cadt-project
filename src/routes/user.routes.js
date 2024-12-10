const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Middleware to validate user ID
const validateUserId = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
    }
    next();
};

// Middleware to validate pagination parameters
const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;
    if (page && isNaN(page)) {
        return res.status(400).json({ error: 'Invalid page number' });
    }
    if (limit && isNaN(limit)) {
        return res.status(400).json({ error: 'Invalid limit number' });
    }
    next();
};

// Create a new user
router.post('/', userController.createUser);

// Get all users with optional filtering and pagination
router.get('/', validatePagination, userController.getUsers);

// Get a single user by ID
router.get('/:id', validateUserId, userController.getUserById);

// Update a user
router.put('/:id', validateUserId, userController.updateUser);

// Delete a user
router.delete('/:id', validateUserId, userController.deleteUser);

module.exports = router;
