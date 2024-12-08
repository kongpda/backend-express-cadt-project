const { PrismaClient } = require('@prisma/client')
const seedUsers = require('./seeders/userSeeder')
const seedCategories = require('./seeders/categorySeeder')
const seedEvents = require('./seeders/eventSeeder')

const prisma = new PrismaClient()

async function main() {
  try {
    // Run seeders in sequence (order matters due to relationships)
    await seedUsers()
    await seedCategories()
    await seedEvents()

    console.log('Seed data inserted successfully')
  } catch (error) {
    console.error('Error seeding data:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
