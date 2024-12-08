const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedCategories() {
  const categories = [
    {
      name: 'Conference',
      description: 'Professional networking events',
    },
    {
      name: 'Workshop',
      description: 'Hands-on learning sessions',
    },
    {
      name: 'Meetup',
      description: 'Casual community gatherings',
    },
  ]

  console.log('Seeding categories...')
  for (const category of categories) {
    await prisma.category.create({
      data: category,
    })
  }
}

module.exports = seedCategories 
