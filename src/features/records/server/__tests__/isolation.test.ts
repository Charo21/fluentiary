import { createMocks } from 'node-mocks-http'
import recordHandler from '../record'
import listHandler from '../list'
import refineHandler from '@/features/refinement/server/refine'
import { getAccount } from '@/features/auth/server/session'
import { prisma } from '@/lib/prisma'
import { refineText } from '@/lib/gemini'

jest.mock('@/features/auth/server/session', () => ({ getAccount: jest.fn() }))
jest.mock('@/lib/prisma', () => ({ prisma: { record: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn() } } }))
jest.mock('@/lib/gemini', () => ({ refineText: jest.fn() }))
const account = getAccount as jest.Mock
const stored = { id: 'r1', userId: 'alice', date: new Date('2026-11-09'), keyPoints: 'private', freeWrite: '', refinedText: null, isComplete: false, createdAt: new Date(), updatedAt: new Date() }
beforeEach(() => { jest.clearAllMocks(); account.mockResolvedValue({ id: 'alice', email: 'a@example.com' }) })

test.each([recordHandler, listHandler, refineHandler])('blocks anonymous business requests before accessing records or LLM', async handler => {
  account.mockResolvedValue(null)
  const { req, res } = createMocks({ method: 'GET', query: { date: '2026-11-09' } })
  await handler(req, res)
  expect(res._getStatusCode()).toBe(401)
  expect(prisma.record.findUnique).not.toHaveBeenCalled()
  expect(prisma.record.findMany).not.toHaveBeenCalled()
  expect(refineText).not.toHaveBeenCalled()
})

test('cannot read another account record on the same date', async () => {
  ;(prisma.record.findUnique as jest.Mock).mockImplementation(({ where }) =>
    Promise.resolve(where.userId_date?.userId === 'alice' ? stored : null))
  account.mockResolvedValue({ id: 'bob', email: 'b@example.com' })
  const { req, res } = createMocks({ method: 'GET', query: { date: '2026-11-09', userId: 'alice' } })
  await recordHandler(req, res)
  expect(res._getStatusCode()).toBe(200)
  expect(res._getJSONData()).toEqual({ record: null })
  expect(prisma.record.findUnique).toHaveBeenCalledWith({ where: { userId_date: { userId: 'bob', date: new Date('2026-11-09') } } })
})

test('saves by session identity, ignoring forged body userId', async () => {
  ;(prisma.record.upsert as jest.Mock).mockResolvedValue(stored)
  const { req, res } = createMocks({ method: 'PUT', query: { date: '2026-11-09' }, body: { userId: 'victim', keyPoints: 'draft' } })
  await recordHandler(req, res)
  expect(res._getStatusCode()).toBe(200)
  expect(prisma.record.upsert).toHaveBeenCalledWith(expect.objectContaining({
    where: { userId_date: { userId: 'alice', date: new Date('2026-11-09') } },
    create: expect.objectContaining({ userId: 'alice', keyPoints: 'draft' }),
  }))
})

test('lists only the session account dates', async () => {
  ;(prisma.record.findMany as jest.Mock).mockResolvedValue([{ date: new Date('2026-11-09') }])
  const { req, res } = createMocks({ method: 'GET', query: { userId: 'victim' } })
  await listHandler(req, res)
  expect(res._getJSONData()).toEqual({ dates: ['2026-11-09'] })
  expect(prisma.record.findMany).toHaveBeenCalledWith({ where: { userId: 'alice' }, select: { date: true }, orderBy: { date: 'desc' } })
})
