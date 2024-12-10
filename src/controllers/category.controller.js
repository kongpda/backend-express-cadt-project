const prisma = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the category
 *         name:
 *           type: string
 *           description: The name of the category
 *         description:
 *           type: string
 *           description: The description of the category
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the category was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the category was last updated
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Event'
 *           description: Events in this category
 */

const categoryController = {
    /**
     * @swagger
     * /api/categories:
     *   post:
     *     summary: Create a new category
     *     tags: [Categories]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Category created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Category'
     *       400:
     *         description: Invalid input data
     *       409:
     *         description: Category name already exists
     */
    createCategory: async (req, res) => {
        try {
            const { name, description } = req.body;

            // Validate required fields
            if (!name) {
                return res.status(400).json({
                    error: 'Category name is required'
                });
            }

            // Check if category name already exists
            const existingCategory = await prisma.category.findUnique({
                where: { name }
            });

            if (existingCategory) {
                return res.status(409).json({
                    error: 'Category name already exists'
                });
            }

            const category = await prisma.category.create({
                data: {
                    name,
                    description
                }
            });

            res.status(201).json(category);
        } catch (error) {
            console.error('Create category error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/categories:
     *   get:
     *     summary: Get all categories
     *     tags: [Categories]
     *     parameters:
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search categories by name
     *       - in: query
     *         name: includeEvents
     *         schema:
     *           type: boolean
     *         description: Include associated events in response
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
     *         description: List of categories
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 categories:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Category'
     *                 total:
     *                   type: integer
     *                 page:
     *                   type: integer
     *                 totalPages:
     *                   type: integer
     */
    getCategories: async (req, res) => {
        try {
            const { search, includeEvents, page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            // Build where clause
            const where = {};
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ];
            }

            // Include events if requested
            const include = includeEvents === 'true' ? {
                events: {
                    orderBy: { date: 'desc' }
                }
            } : undefined;

            // Get total count for pagination
            const total = await prisma.category.count({ where });

            // Get categories with pagination
            const categories = await prisma.category.findMany({
                where,
                include,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: {
                    name: 'asc'
                }
            });

            res.json({
                categories,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/categories/{id}:
     *   get:
     *     summary: Get a category by ID
     *     tags: [Categories]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Category ID
     *       - in: query
     *         name: includeEvents
     *         schema:
     *           type: boolean
     *         description: Include associated events in response
     *     responses:
     *       200:
     *         description: Category details
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Category'
     *       404:
     *         description: Category not found
     */
    getCategoryById: async (req, res) => {
        try {
            const categoryId = parseInt(req.params.id);
            const { includeEvents } = req.query;

            if (isNaN(categoryId)) {
                return res.status(400).json({ error: 'Invalid category ID' });
            }

            const category = await prisma.category.findUnique({
                where: { id: categoryId },
                include: includeEvents === 'true' ? {
                    events: {
                        orderBy: { date: 'desc' }
                    }
                } : undefined
            });

            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            res.json(category);
        } catch (error) {
            console.error('Get category by ID error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/categories/{id}:
     *   put:
     *     summary: Update a category
     *     tags: [Categories]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Category ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Category updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Category'
     *       400:
     *         description: Invalid input data
     *       404:
     *         description: Category not found
     *       409:
     *         description: Category name already exists
     */
    updateCategory: async (req, res) => {
        try {
            const categoryId = parseInt(req.params.id);
            const { name, description } = req.body;

            if (isNaN(categoryId)) {
                return res.status(400).json({ error: 'Invalid category ID' });
            }

            // Check if category exists
            const existingCategory = await prisma.category.findUnique({
                where: { id: categoryId }
            });

            if (!existingCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }

            // If name is being updated, check for uniqueness
            if (name && name !== existingCategory.name) {
                const nameExists = await prisma.category.findFirst({
                    where: {
                        name,
                        NOT: {
                            id: categoryId
                        }
                    }
                });

                if (nameExists) {
                    return res.status(409).json({
                        error: 'Category name already exists'
                    });
                }
            }

            const category = await prisma.category.update({
                where: { id: categoryId },
                data: {
                    name,
                    description
                }
            });

            res.json(category);
        } catch (error) {
            console.error('Update category error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    /**
     * @swagger
     * /api/categories/{id}:
     *   delete:
     *     summary: Delete a category
     *     tags: [Categories]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Category ID
     *     responses:
     *       204:
     *         description: Category deleted successfully
     *       404:
     *         description: Category not found
     *       409:
     *         description: Cannot delete category with associated events
     */
    deleteCategory: async (req, res) => {
        try {
            const categoryId = parseInt(req.params.id);

            if (isNaN(categoryId)) {
                return res.status(400).json({ error: 'Invalid category ID' });
            }

            // Check if category exists and has events
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
                include: {
                    _count: {
                        select: { events: true }
                    }
                }
            });

            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            // Prevent deletion if category has events
            if (category._count.events > 0) {
                return res.status(409).json({
                    error: 'Cannot delete category with associated events'
                });
            }

            await prisma.category.delete({
                where: { id: categoryId }
            });

            res.status(204).send();
        } catch (error) {
            console.error('Delete category error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = categoryController;
