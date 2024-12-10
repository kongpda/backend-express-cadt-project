const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedEvents() {
  try {
    // First, get some reference data
    const users = await prisma.user.findMany()
    const categories = await prisma.category.findMany()

    const organizerId = users.find(u => u.role === 'organizer')?.id || users[0].id

    const events = [
      {
        title: 'Tech Conference 2024',
        slug: 'tech-conference-2024',
        description: 'A comprehensive technology conference featuring the latest innovations and industry trends.',
        shortDescription: 'Annual tech conference showcasing latest innovations',
        startDate: new Date('2024-03-15T09:00:00Z'),
        endDate: new Date('2024-03-17T18:00:00Z'),
        location: 'Phnom Penh',
        venue: 'Diamond Island Convention Center',
        address: '123 Koh Pich Street',
        city: 'Phnom Penh',
        country: 'Cambodia',
        status: 'published',
        maxAttendees: 500,
        categoryId: categories.find(c => c.name === 'Technology')?.id,
        organizerId: organizerId,
        tickets: {
          create: [
            {
              type: 'paid',
              name: 'Early Bird Ticket',
              description: 'Limited early bird tickets at a special price',
              price: 50.00,
              quantity: 100,
              available: 100
            },
            {
              type: 'paid',
              name: 'Regular Ticket',
              description: 'Standard conference admission',
              price: 75.00,
              quantity: 300,
              available: 300
            }
          ]
        },
        tags: {
          create: [
            { name: 'technology' },
            { name: 'innovation' },
            { name: 'networking' }
          ]
        }
      },
      {
        title: 'Cambodia Music Festival',
        slug: 'cambodia-music-festival-2024',
        description: 'A celebration of Cambodian music and culture featuring local and international artists.',
        shortDescription: 'Annual music festival celebrating Cambodian culture',
        startDate: new Date('2024-04-20T16:00:00Z'),
        endDate: new Date('2024-04-21T23:00:00Z'),
        location: 'Siem Reap',
        venue: 'Angkor Arena',
        address: '456 Temple Road',
        city: 'Siem Reap',
        country: 'Cambodia',
        status: 'published',
        maxAttendees: 1000,
        categoryId: categories.find(c => c.name === 'Music & Concerts')?.id,
        organizerId: organizerId,
        tickets: {
          create: [
            {
              type: 'paid',
              name: 'General Admission',
              description: 'Full festival access',
              price: 30.00,
              quantity: 800,
              available: 800
            },
            {
              type: 'paid',
              name: 'VIP Pass',
              description: 'VIP area access with complimentary refreshments',
              price: 100.00,
              quantity: 200,
              available: 200
            }
          ]
        },
        tags: {
          create: [
            { name: 'music' },
            { name: 'culture' },
            { name: 'festival' }
          ]
        }
      }
    ]

    for (const event of events) {
      await prisma.event.create({
        data: event
      })
    }

    console.log('Events seeded successfully')
  } catch (error) {
    console.error('Error seeding events:', error)
    throw error
  }
}

module.exports = seedEvents
