const express = require('express');
const { body, query } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole, ROLES } = require('../middleware/role.middleware');

const router = express.Router();

// Validation middleware
const validateRoleUpdate = [
    body('role')
        .isIn(Object.keys(ROLES))
        .withMessage('Invalid role specified')
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(checkRole('admin')); // Minimum admin role required

// User management routes
router.get('/users', validatePagination, adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/role', validateRoleUpdate, adminController.updateUserRole);

module.exports = router;
