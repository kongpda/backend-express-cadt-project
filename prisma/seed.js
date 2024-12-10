const { PrismaClient } = require('@prisma/client')
const seedUsers = require('./seeders/userSeeder')
const seedCategories = require('./seeders/categorySeeder')
const seedOrganizations = require('./seeders/organizationSeeder')
const seedEvents = require('./seeders/eventSeeder')

const prisma = new PrismaClient()

async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname='public' AND tablename != '_prisma_migrations';
  `

  for (const { tablename } of tablenames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`)
    } catch (error) {
      console.log(`Error truncating ${tablename}:`, error)
    }
  }
}

async function main() {
  try {
    // Clean the database first
    await cleanDatabase()

    // Run seeders in sequence (order matters due to relationships)
    await seedUsers()
    await seedCategories()
    await seedOrganizations()
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
