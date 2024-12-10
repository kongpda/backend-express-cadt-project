const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedOrganizations() {
  try {
    const organizer = await prisma.user.findFirst({
      where: {
        role: 'organizer'
      }
    })

    if (!organizer) {
      console.log('No organizer found, skipping organization seeding')
      return
    }

    // Create one organization for the organizer
    await prisma.organization.create({
      data: {
        name: 'Tech Events Cambodia',
        description: 'Leading technology events organizer in Cambodia',
        website: 'https://techevents.kh',
        status: 'approved',
        verifiedAt: new Date(),
        address: '123 Norodom Blvd',
        city: 'Phnom Penh',
        country: 'Cambodia',
        userId: organizer.id
      }
    })

    console.log('Organizations seeded successfully')
  } catch (error) {
    console.error('Error seeding organizations:', error)
    throw error
  }
}

module.exports = seedOrganizations
