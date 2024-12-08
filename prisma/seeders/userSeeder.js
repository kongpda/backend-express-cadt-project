const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedUsers() {
  const users = [
    {
      email: 'john@example.com',
      name: 'John Doe',
    },
    {
      email: 'jane@example.com',
      name: 'Jane Smith',
    },
  ]

  console.log('Seeding users...')
  for (const user of users) {
    await prisma.user.create({
      data: user,
    })
  }
}

module.exports = seedUsers
