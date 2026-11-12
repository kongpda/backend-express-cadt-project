const prisma = require('../config/database');
const { validateRoleChange, ROLES } = require('../middleware/role.middleware');

class AdminController {
    /**
     * Update user role
     * Only admins with higher roles can modify roles of users with lower roles
     */
    async updateUserRole(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { role: newRole } = req.body;

            if (!userId || isNaN(userId)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }

            // Find target user
            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                }
            });

            if (!targetUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Validate role change
            const canChangeRole = validateRoleChange(
                targetUser.role,
                newRole,
                req.user.role
            );

            if (!canChangeRole) {
                return res.status(403).json({
                    message: 'You do not have permission to set this role'
                });
            }

            // Update user role
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { role: newRole },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                }
            });

            res.json({
                message: 'User role updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update user role error:', error);
            res.status(500).json({
                message: 'Error updating user role',
                error: error.message
            });
        }
    }

    /**
     * Get all users with role information
     * Admins can see users with lower roles than themselves
     */
    async getUsers(req, res) {
        try {
            const { page = 1, limit = 10, role } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Build where clause
            const where = {
                role: {
                    // Only show users with lower roles than the admin
                    in: Object.keys(ROLES).filter(r => ROLES[r] < ROLES[req.user.role])
                }
            };

            // Add role filter if specified
            if (role && ROLES[role] < ROLES[req.user.role]) {
                where.role = role;
            }

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true
                    },
                    skip,
                    take: parseInt(limit),
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma.user.count({ where })
            ]);

            res.json({
                users,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit))
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                message: 'Error fetching users',
                error: error.message
            });
        }
    }

    /**
     * Get detailed user information
     * Admins can only view users with lower roles
     */
    async getUserDetails(req, res) {
        try {
            const userId = parseInt(req.params.id);

            if (!userId || isNaN(userId)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    profile: {
                        select: {
                            username: true,
                            bio: true,
                            location: true,
                            website: true,
                            phone: true,
                            profileImage: true,
                            interests: true,
                            visibility: true
                        }
                    }
                }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if admin has permission to view this user
            if (ROLES[req.user.role] <= ROLES[user.role]) {
                return res.status(403).json({
                    message: 'You do not have permission to view this user'
                });
            }

            res.json(user);
        } catch (error) {
            console.error('Get user details error:', error);
            res.status(500).json({
                message: 'Error fetching user details',
                error: error.message
            });
        }
    }
}

module.exports = new AdminController();
