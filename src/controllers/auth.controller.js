const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Define allowed roles and their hierarchy
const ROLES = {
    user: 0,
    moderator: 1,
    admin: 2,
    superAdmin: 3
};

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         name:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

class AuthController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - name
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               name:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   */
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'User already exists',
        });
      }

      // In production, only allow setting privileged roles through admin panel
      // For testing purposes, only allow superAdmin role if NODE_ENV is test
      let userRole = 'user';
      if (process.env.NODE_ENV === 'test' && role === 'superAdmin') {
        userRole = 'superAdmin';
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: userRole,
          profile: {
            create: {
              username: email.split('@')[0], // Default username from email
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          profile: true,
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        message: 'Error registering user',
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          message: 'Invalid credentials',
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Invalid credentials',
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(401).json({
          message: 'Account is not active',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: 'Error logging in',
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current user profile
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user profile
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   */
  async getCurrentUser(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          profile: {
            select: {
              id: true,
              username: true,
              bio: true,
              location: true,
              website: true,
              phone: true,
              profileImage: true,
              coverImage: true,
              socialLinks: true,
              interests: true,
              visibility: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        message: 'Error fetching user profile',
        error: error.message
      });
    }
  }

  async cleanupTestUsers(req, res) {
    try {
      if (process.env.NODE_ENV !== 'test') {
        return res.status(403).json({ message: 'This endpoint is only available in test environment' });
      }

      const { emails } = req.body;
      if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ message: 'Invalid emails array provided' });
      }

      // Delete profiles first due to foreign key constraint
      await prisma.profile.deleteMany({
        where: {
          user: {
            email: {
              in: emails
            }
          }
        }
      });

      // Then delete users
      await prisma.user.deleteMany({
        where: {
          email: {
            in: emails
          }
        }
      });

      return res.status(200).json({ message: 'Test users cleaned up successfully' });
    } catch (error) {
      console.error('Cleanup error:', error);
      return res.status(500).json({ message: 'Error cleaning up test users', error: error.message });
    }
  }
}

module.exports = new AuthController();
