import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/records/[date]'
import { prisma } from '@/lib/prisma'


jest.mock('@/features/auth/server/session', () => ({ getAccount: jest.fn().mockResolvedValue({ id: 'integration-user', email: 'integration@example.test' }) }))

if (!process.env.TEST_DATABASE_URL || process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL) {
  throw new Error('Set DATABASE_URL and TEST_DATABASE_URL to the same disposable test database')
}

describe('/api/records/[date]', () => {
  beforeEach(async () => {
    await prisma.record.deleteMany({ where: { userId: 'integration-user' } })
    await prisma.user.upsert({ where: { id: 'integration-user' }, update: {}, create: { id: 'integration-user', email: 'integration@example.test' } })
  })

  describe('GET', () => {
    it('should return null when record does not exist', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { date: '2024-01-01' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.record).toBeNull()
    })

    it('should return record when it exists', async () => {
      await prisma.record.create({
        data: {
          userId: 'integration-user',
          date: new Date('2024-01-01'),
          keyPoints: 'Test key points',
          freeWrite: 'Test free write',
          refinedText: 'Test refined text',
          isComplete: true,
        },
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { date: '2024-01-01' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.record).toBeTruthy()
      expect(data.record.keyPoints).toBe('Test key points')
      expect(data.record.freeWrite).toBe('Test free write')
      expect(data.record.refinedText).toBe('Test refined text')
    })

    it('should return 400 for invalid date format', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { date: 'invalid-date' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Invalid date format')
    })
  })

  describe('PUT', () => {
    it('should create new record when it does not exist', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { date: '2024-01-01' },
        body: {
          keyPoints: 'New key points',
          freeWrite: 'New free write',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.record.keyPoints).toBe('New key points')
      expect(data.record.freeWrite).toBe('New free write')

      const dbRecord = await prisma.record.findUnique({
        where: { userId_date: { userId: 'integration-user', date: new Date('2024-01-01') } },
      })
      expect(dbRecord).toBeTruthy()
    })

    it('should update existing record', async () => {
      await prisma.record.create({
        data: {
          userId: 'integration-user',
          date: new Date('2024-01-01'),
          keyPoints: 'Old key points',
          freeWrite: 'Old free write',
        },
      })

      const { req, res } = createMocks({
        method: 'PUT',
        query: { date: '2024-01-01' },
        body: {
          keyPoints: 'Updated key points',
          freeWrite: 'Updated free write',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.record.keyPoints).toBe('Updated key points')
      expect(data.record.freeWrite).toBe('Updated free write')
    })

    it('should set isComplete to true when refinedText is provided', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { date: '2024-01-01' },
        body: {
          keyPoints: 'Key points',
          freeWrite: 'Free write',
          refinedText: 'Refined text',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.record.isComplete).toBe(true)
      expect(data.record.refinedText).toBe('Refined text')
    })

    it('should set isComplete to false when refinedText is not provided', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { date: '2024-01-01' },
        body: {
          keyPoints: 'Key points',
          freeWrite: 'Free write',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.record.isComplete).toBe(false)
    })

    it('should return 400 for invalid date format', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { date: 'invalid-date' },
        body: {
          keyPoints: 'Key points',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Invalid date format')
    })

    it('should return 400 for invalid keyPoints type', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { date: '2024-01-01' },
        body: {
          keyPoints: 123,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('keyPoints must be a string')
    })

    it('should return 400 for invalid freeWrite type', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { date: '2024-01-01' },
        body: {
          freeWrite: true,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('freeWrite must be a string')
    })

    it('should return 400 for invalid refinedText type', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { date: '2024-01-01' },
        body: {
          refinedText: 123,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('refinedText must be a string or null')
    })
  })

  it('should return 405 for unsupported methods', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { date: '2024-01-01' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
