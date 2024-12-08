const prisma = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - date
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the event
 *         title:
 *           type: string
 *           description: The title of the event
 *         description:
 *           type: string
 *           description: The description of the event
 *         date:
 *           type: string
 *           format: date-time
 *           description: The date and time of the event
 *         location:
 *           type: string
 *           description: The location of the event
 *         status:
 *           type: string
 *           enum: [draft, published, cancelled]
 *           description: The status of the event
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the event was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the event was last updated
 */

const eventController = {
    /**
     * @swagger
     * /api/events:
     *   post:
     *     summary: Create a new event
     *     tags: [Events]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Event'
     *     responses:
     *       201:
     *         description: The event was successfully created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Event'
     *       400:
     *         description: Invalid input data
     */
    createEvent: async (req, res) => {
        try {
            const { title, description, date, location, status = 'draft' } = req.body;

            // Basic validation
            if (!title || !description || !date) {
                return res.status(400).json({
                    error: 'Title, description, and date are required'
                });
            }

            // Validate date format
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({
                    error: 'Invalid date format'
                });
            }

            const event = await prisma.event.create({
                data: {
                    title,
                    description,
                    date: dateObj,
                    location,
                    status
                }
            });

            res.status(201).json(event);
        } catch (error) {
            console.error('Create event error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/events:
     *   get:
     *     summary: Get all events
     *     tags: [Events]
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [draft, published, cancelled]
     *         description: Filter events by status
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *         description: Page number for pagination
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         description: Number of items per page
     *     responses:
     *       200:
     *         description: List of events
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 events:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Event'
     *                 total:
     *                   type: integer
     *                 page:
     *                   type: integer
     *                 totalPages:
     *                   type: integer
     */
    getEvents: async (req, res) => {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            // Build where clause
            const where = {};
            if (status) {
                where.status = status;
            }

            // Get total count for pagination
            const total = await prisma.event.count({ where });

            // Get events with pagination
            const events = await prisma.event.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: {
                    date: 'desc'
                }
            });

            res.json({
                events,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error('Get events error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/events/{id}:
     *   get:
     *     summary: Get an event by id
     *     tags: [Events]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: The event id
     *     responses:
     *       200:
     *         description: The event data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Event'
     *       404:
     *         description: Event not found
     */
    getEventById: async (req, res) => {
        try {
            const eventId = parseInt(req.params.id);

            if (isNaN(eventId)) {
                return res.status(400).json({ error: 'Invalid event ID' });
            }

            const event = await prisma.event.findUnique({
                where: { id: eventId }
            });

            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            res.json(event);
        } catch (error) {
            console.error('Get event by ID error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/events/{id}:
     *   put:
     *     summary: Update an event
     *     tags: [Events]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: The event id
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Event'
     *     responses:
     *       200:
     *         description: The updated event
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Event'
     *       400:
     *         description: Invalid input data
     *       404:
     *         description: Event not found
     */
    updateEvent: async (req, res) => {
        try {
            const eventId = parseInt(req.params.id);

            if (isNaN(eventId)) {
                return res.status(400).json({ error: 'Invalid event ID' });
            }

            // Check if event exists
            const existingEvent = await prisma.event.findUnique({
                where: { id: eventId }
            });

            if (!existingEvent) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Validate date if provided
            if (req.body.date) {
                const dateObj = new Date(req.body.date);
                if (isNaN(dateObj.getTime())) {
                    return res.status(400).json({
                        error: 'Invalid date format'
                    });
                }
                req.body.date = dateObj;
            }

            const event = await prisma.event.update({
                where: { id: eventId },
                data: req.body
            });

            res.json(event);
        } catch (error) {
            console.error('Update event error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/events/{id}:
     *   delete:
     *     summary: Delete an event
     *     tags: [Events]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: The event id
     *     responses:
     *       204:
     *         description: Event deleted successfully
     *       404:
     *         description: Event not found
     */
    deleteEvent: async (req, res) => {
        try {
            const eventId = parseInt(req.params.id);

            if (isNaN(eventId)) {
                return res.status(400).json({ error: 'Invalid event ID' });
            }

            // Check if event exists
            const existingEvent = await prisma.event.findUnique({
                where: { id: eventId }
            });

            if (!existingEvent) {
                return res.status(404).json({ error: 'Event not found' });
            }

            await prisma.event.delete({
                where: { id: eventId }
            });

            res.status(204).send();
        } catch (error) {
            console.error('Delete event error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = eventController;
