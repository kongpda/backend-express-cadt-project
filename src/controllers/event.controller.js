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
 *         - startDate
 *         - endDate
 *         - categoryId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the event
 *         title:
 *           type: string
 *           description: The title of the event
 *         slug:
 *           type: string
 *           description: URL-friendly version of the title
 *         description:
 *           type: string
 *           description: The full description of the event
 *         shortDescription:
 *           type: string
 *           description: A brief description of the event
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: The start date and time of the event
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: The end date and time of the event
 *         location:
 *           type: string
 *           description: General location of the event
 *         venue:
 *           type: string
 *           description: Specific venue name
 *         address:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City name
 *         country:
 *           type: string
 *           description: Country name
 *         status:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *           description: The status of the event
 *         maxAttendees:
 *           type: integer
 *           description: Maximum number of attendees
 *         coverImage:
 *           type: string
 *           description: URL of the event cover image
 *         categoryId:
 *           type: integer
 *           description: ID of the event category
 *         organizerId:
 *           type: integer
 *           description: ID of the event organizer
 *         organizationId:
 *           type: integer
 *           description: Optional ID of the associated organization
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
            const {
                title,
                description,
                shortDescription,
                startDate,
                endDate,
                location,
                venue,
                address,
                city,
                country,
                status = 'draft',
                maxAttendees,
                coverImage,
                categoryId,
                organizationId
            } = req.body;

            // Basic validation
            if (!title || !description || !startDate || !endDate || !categoryId) {
                return res.status(400).json({
                    error: 'Title, description, startDate, endDate, and categoryId are required'
                });
            }

            // Validate dates
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                return res.status(400).json({
                    error: 'Invalid date format'
                });
            }

            if (endDateObj < startDateObj) {
                return res.status(400).json({
                    error: 'End date must be after start date'
                });
            }

            // Generate slug from title
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

            const event = await prisma.event.create({
                data: {
                    title,
                    slug,
                    description,
                    shortDescription,
                    startDate: startDateObj,
                    endDate: endDateObj,
                    location,
                    venue,
                    address,
                    city,
                    country,
                    status,
                    maxAttendees,
                    coverImage,
                    categoryId,
                    organizerId: req.user.id, // Assuming you have user info in request
                    organizationId
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
                    startDate: 'desc'
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
