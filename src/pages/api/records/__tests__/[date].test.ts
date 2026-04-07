import { createMocks } from 'node-mocks-http'
import handler from '../[date]'
import { prisma } from '@/lib/prisma'

describe('/api/records/[date]', () => {
  beforeEach(async () => {
    await prisma.record.deleteMany()
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
        where: { date: new Date('2024-01-01') },
      })
      expect(dbRecord).toBeTruthy()
    })

    it('should update existing record', async () => {
      await prisma.record.create({
        data: {
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
