import { createAuthAdapter } from '../adapter'

jest.mock('@/lib/prisma', () => ({ prisma: {
  user: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  account: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
} }))
import { prisma } from '@/lib/prisma'

const user = { id: 'u1', name: 'Alice', email: 'alice@example.com' }
const adapter = createAuthAdapter()

beforeEach(() => jest.clearAllMocks())

test('registers a user without persisting provider image or verification fields', async () => {
  ;(prisma.user.create as jest.Mock).mockResolvedValue(user)
  const result = await adapter.createUser!({ ...user, image: 'https://example.com/avatar', emailVerified: new Date() })
  expect(prisma.user.create).toHaveBeenCalledWith({ data: { name: 'Alice', email: 'alice@example.com' } })
  expect(result).toMatchObject({ ...user, image: null, emailVerified: null })
})

test('looks up an existing account by provider identity, preserving internal ID', async () => {
  ;(prisma.account.findUnique as jest.Mock).mockResolvedValue({ user })
  expect(await adapter.getUserByAccount!({ provider: 'google', providerAccountId: 'google-123' })).toMatchObject({ id: 'u1' })
  expect(prisma.account.findUnique).toHaveBeenCalledWith({
    where: { provider_providerAccountId: { provider: 'google', providerAccountId: 'google-123' } }, include: { user: true },
  })
})

test('rejects registration without an email', async () => {
  await expect(adapter.createUser!({ email: '', emailVerified: null })).rejects.toThrow()
  expect(prisma.user.create).not.toHaveBeenCalled()
})

test('updates only supported user fields', async () => {
  ;(prisma.user.update as jest.Mock).mockResolvedValue(user)
  await adapter.updateUser!({ id: 'u1', name: 'New name', image: 'discard', emailVerified: new Date() })
  expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { name: 'New name' } })
})
