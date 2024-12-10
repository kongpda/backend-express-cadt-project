const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');

// Create a new event
router.post('/', eventController.createEvent);

// Get all events
router.get('/', eventController.getEvents);

// Get a single event by ID
router.get('/:id', eventController.getEventById);

// Update an event
router.put('/:id', eventController.updateEvent);

// Delete an event
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
