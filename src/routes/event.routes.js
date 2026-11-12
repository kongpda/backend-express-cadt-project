const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkEventOwnership = require('../middleware/checkEventOwnership.middleware');

// Public routes
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);

// Protected routes (require authentication)
router.post('/', authMiddleware, eventController.createEvent);
router.put('/:id', authMiddleware, checkEventOwnership, eventController.updateEvent);
router.delete('/:id', authMiddleware, checkEventOwnership, eventController.deleteEvent);

module.exports = router;
