// Jest setup file
require('dotenv').config()
import '@testing-library/jest-dom'

// Only load prisma for node environment tests
if (process.env.JEST_WORKER_ID !== undefined) {
  afterAll(async () => {
    try {
      const { prisma } = require('./src/lib/prisma')
      await prisma.$disconnect()
    } catch (e) {
      // Ignore errors in jsdom environment
    }
  })
}
