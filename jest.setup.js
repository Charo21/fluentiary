// Jest setup file
require('dotenv').config()
import '@testing-library/jest-dom'

// Polyfill fetch for tests if not available
if (typeof global.fetch === 'undefined') {
  global.fetch = async () => {
    throw new Error('fetch is not available in test environment')
  }
}

// Only load prisma for node environment tests
if (process.env.JEST_WORKER_ID !== undefined) {
  afterAll(async () => {
    try {
      const { prisma } = require('./src/lib/prisma')
      await prisma.$disconnect()
    } catch (e) {
      // Ignore errors in node environment
    }
  })
}
