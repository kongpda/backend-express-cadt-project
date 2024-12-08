const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedEvents() {
  // First get some categories and users for references
  const categories = await prisma.category.findMany()
  const users = await prisma.user.findMany()

  const events = [
    {
      title: 'Tech Conference 2024',
      description: 'Annual technology conference',
      date: new Date('2024-12-01'),
      categoryId: categories[0].id,
      organizerId: users[0].id,
    },
    {
      title: 'Coding Workshop',
      description: 'Learn to code in JavaScript',
      date: new Date('2024-08-15'),
      categoryId: categories[1].id,
      organizerId: users[1].id,
    },
  ]

  console.log('Seeding events...')
  for (const event of events) {
    await prisma.event.create({
      data: event,
    })
  }
}

module.exports = seedEvents 
