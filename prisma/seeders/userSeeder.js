const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function seedUsers() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Create admin user
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        profile: {
          create: {
            username: 'admin_user',
            bio: 'System administrator',
            location: 'Phnom Penh, Cambodia',
            visibility: 'public',
            interests: ['technology', 'management']
          }
        }
      }
    })

    // Create organizer user
    await prisma.user.create({
      data: {
        email: 'organizer@example.com',
        name: 'Event Organizer',
        password: hashedPassword,
        role: 'organizer',
        status: 'active',
        profile: {
          create: {
            username: 'event_organizer',
            bio: 'Professional event organizer',
            location: 'Siem Reap, Cambodia',
            visibility: 'public',
            interests: ['events', 'networking']
          }
        }
      }
    })

    // Create regular user
    await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Regular User',
        password: hashedPassword,
        role: 'user',
        status: 'active',
        profile: {
          create: {
            username: 'regular_user',
            bio: 'Event enthusiast',
            location: 'Battambang, Cambodia',
            visibility: 'public',
            interests: ['music', 'arts']
          }
        }
      }
    })

    console.log('Users seeded successfully')
  } catch (error) {
    console.error('Error seeding users:', error)
    throw error
  }
}

module.exports = seedUsers
