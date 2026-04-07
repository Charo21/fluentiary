// Jest setup file
require('dotenv').config()

afterAll(async () => {
  const { prisma } = require('./src/lib/prisma')
  await prisma.$disconnect()
})
