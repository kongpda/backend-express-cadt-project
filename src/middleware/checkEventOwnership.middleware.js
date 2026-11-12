const prisma = require('../config/database');

const checkEventOwnership = async (req, res, next) => {
    try {
        const eventId = parseInt(req.params.id);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Allow super-admins to modify any event
        if (req.user.role === 'superAdmin') {
            return next();
        }

        // For other users, check if they own the event
        if (event.organizerId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized to modify this event' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = checkEventOwnership;
