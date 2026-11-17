import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/records/list'
import { prisma } from '@/lib/prisma'


jest.mock('@/features/auth/server/session', () => ({ getAccount: jest.fn().mockResolvedValue({ id: 'integration-user', email: 'integration@example.test' }) }))

if (!process.env.TEST_DATABASE_URL || process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL) {
  throw new Error('Set DATABASE_URL and TEST_DATABASE_URL to the same disposable test database')
}

describe('/api/records/list', () => {
  beforeEach(async () => {
    await prisma.record.deleteMany({ where: { userId: 'integration-user' } })
    await prisma.user.upsert({ where: { id: 'integration-user' }, update: {}, create: { id: 'integration-user', email: 'integration@example.test' } })
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
        { userId: 'integration-user', date: new Date('2024-01-01'), keyPoints: 'test1', freeWrite: 'test1' },
        { userId: 'integration-user', date: new Date('2024-01-02'), keyPoints: 'test2', freeWrite: 'test2' },
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
