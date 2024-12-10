const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedCategories() {
  const categories = [
    {
      name: 'Music & Concerts',
      description: 'Live music performances, concerts, and musical events',
      slug: 'music-concerts'
    },
    {
      name: 'Technology',
      description: 'Tech conferences, workshops, and meetups',
      slug: 'technology'
    },
    {
      name: 'Business & Professional',
      description: 'Networking events, conferences, and business seminars',
      slug: 'business-professional'
    },
    {
      name: 'Arts & Culture',
      description: 'Art exhibitions, cultural festivals, and performances',
      slug: 'arts-culture'
    },
    {
      name: 'Sports & Fitness',
      description: 'Sporting events, tournaments, and fitness activities',
      slug: 'sports-fitness'
    },
    {
      name: 'Education',
      description: 'Educational workshops, seminars, and training sessions',
      slug: 'education'
    },
    {
      name: 'Food & Drink',
      description: 'Food festivals, cooking classes, and tasting events',
      slug: 'food-drink'
    }
  ]

  for (const category of categories) {
    await prisma.category.create({
      data: category
    })
  }

  console.log('Categories seeded successfully')
}

module.exports = seedCategories
