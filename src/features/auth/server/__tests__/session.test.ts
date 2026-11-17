import { createMocks } from 'node-mocks-http'
import { getServerSession } from 'next-auth/next'
import { getAccount, requirePageSession } from '../session'

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }))
jest.mock('../options', () => ({ authOptions: {} }))
const getSession = getServerSession as jest.Mock
beforeEach(() => jest.clearAllMocks())

test('returns null for missing or incomplete sessions', async () => {
  const { req, res } = createMocks()
  for (const session of [null, { user: { email: 'a@example.com' } }, { user: { id: 'u1' } }]) {
    getSession.mockResolvedValue(session)
    expect(await getAccount(req, res)).toBeNull()
  }
})
test('returns only the session account identity', async () => {
  getSession.mockResolvedValue({ user: { id: 'u1', email: 'a@example.com', name: 'Alice', image: 'ignored' } })
  const { req, res } = createMocks()
  expect(await getAccount(req, res)).toEqual({ id: 'u1', name: 'Alice', email: 'a@example.com' })
})
test('redirects anonymous page requests to login with original relative URL', async () => {
  getSession.mockResolvedValue(null)
  const { req, res } = createMocks()
  const result = await requirePageSession({ req, res, resolvedUrl: '/record/2026-11-09' } as any)
  expect(result).toEqual({ redirect: { destination: '/login?callbackUrl=%2Frecord%2F2026-11-09', permanent: false } })
})
