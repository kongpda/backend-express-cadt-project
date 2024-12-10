const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// Middleware to validate category ID
const validateCategoryId = (req, res, next) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid category ID format' });
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

// Create a new category
router.post('/', categoryController.createCategory);

// Get all categories with optional filtering and pagination
router.get('/', validatePagination, categoryController.getCategories);

// Get a single category by ID
router.get('/:id', validateCategoryId, categoryController.getCategoryById);

// Update a category
router.put('/:id', validateCategoryId, categoryController.updateCategory);

// Delete a category
router.delete('/:id', validateCategoryId, categoryController.deleteCategory);

module.exports = router;
