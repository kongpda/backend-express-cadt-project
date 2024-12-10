const prisma = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated user ID
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         name:
 *           type: string
 *           description: User's name
 *         role:
 *           type: string
 *           enum: [user, admin, moderator]
 *           default: user
 *           description: User's role
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           default: active
 *           description: User's status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was last updated
 */

const userController = {
    /**
     * @swagger
     * /api/users:
     *   post:
     *     summary: Create a new user
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - name
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               name:
     *                 type: string
     *               role:
     *                 type: string
     *                 enum: [user, admin, moderator]
     *               status:
     *                 type: string
     *                 enum: [active, inactive, suspended]
     *     responses:
     *       201:
     *         description: User created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Invalid input data
     *       409:
     *         description: Email already exists
     */
    async createUser(req, res) {
        try {
            const { email, name, role = 'user', status = 'active' } = req.body;

            // Basic validation
            if (!email || !name) {
                return res.status(400).json({
                    error: 'Email and name are required'
                });
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Invalid email format'
                });
            }

            // Check if email already exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(409).json({
                    error: 'Email already exists'
                });
            }

            const user = await prisma.user.create({
                data: {
                    email,
                    name,
                    role,
                    status
                }
            });

            res.status(201).json(user);
        } catch (error) {
            console.error('Create user error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/users:
     *   get:
     *     summary: Retrieve users
     *     tags: [Users]
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [active, inactive, suspended]
     *         description: Filter users by status
     *       - in: query
     *         name: role
     *         schema:
     *           type: string
     *           enum: [user, admin, moderator]
     *         description: Filter users by role
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search users by name or email
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
     *         description: List of users
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 users:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/User'
     *                 total:
     *                   type: integer
     *                 page:
     *                   type: integer
     *                 totalPages:
     *                   type: integer
     */
    async getUsers(req, res) {
        try {
            const { status, role, search, page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            // Build where clause
            const where = {};
            if (status) {
                where.status = status;
            }
            if (role) {
                where.role = role;
            }
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ];
            }

            // Get total count for pagination
            const total = await prisma.user.count({ where });

            // Get users with pagination
            const users = await prisma.user.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: {
                    createdAt: 'desc'
                }
            });

            res.json({
                users,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/users/{id}:
     *   get:
     *     summary: Get a user by ID
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: User ID
     *     responses:
     *       200:
     *         description: User details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       404:
     *         description: User not found
     */
    async getUserById(req, res) {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json(user);
        } catch (error) {
            console.error('Get user by ID error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/users/{id}:
     *   put:
     *     summary: Update a user
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: User ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               name:
     *                 type: string
     *               role:
     *                 type: string
     *                 enum: [user, admin, moderator]
     *               status:
     *                 type: string
     *                 enum: [active, inactive, suspended]
     *     responses:
     *       200:
     *         description: User updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       400:
     *         description: Invalid input data
     *       404:
     *         description: User not found
     *       409:
     *         description: Email already exists
     */
    async updateUser(req, res) {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!existingUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            // If email is being updated, validate format and uniqueness
            if (req.body.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(req.body.email)) {
                    return res.status(400).json({
                        error: 'Invalid email format'
                    });
                }

                // Check if new email already exists for another user
                const emailExists = await prisma.user.findFirst({
                    where: {
                        email: req.body.email,
                        NOT: {
                            id: userId
                        }
                    }
                });

                if (emailExists) {
                    return res.status(409).json({
                        error: 'Email already exists'
                    });
                }
            }

            const user = await prisma.user.update({
                where: { id: userId },
                data: req.body
            });

            res.json(user);
        } catch (error) {
            console.error('Update user error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/users/{id}:
     *   delete:
     *     summary: Delete a user
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: User ID
     *     responses:
     *       204:
     *         description: User deleted successfully
     *       404:
     *         description: User not found
     */
    async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!existingUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            await prisma.user.delete({
                where: { id: userId }
            });

            res.status(204).send();
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = userController;
