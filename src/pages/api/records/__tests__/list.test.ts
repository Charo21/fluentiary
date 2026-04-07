import { createMocks } from 'node-mocks-http'
import handler from '../list'
import { prisma } from '@/lib/prisma'

describe('/api/records/list', () => {
  beforeEach(async () => {
    await prisma.record.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should return empty array when no records exist', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.dates).toEqual([])
  })

  it('should return list of dates with records', async () => {
    await prisma.record.createMany({
      data: [
        { date: new Date('2024-01-01'), keyPoints: 'test1', freeWrite: 'test1' },
        { date: new Date('2024-01-02'), keyPoints: 'test2', freeWrite: 'test2' },
      ],
    })

    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.dates).toHaveLength(2)
    expect(data.dates).toContain('2024-01-01')
    expect(data.dates).toContain('2024-01-02')
  })

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
