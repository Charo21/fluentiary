import type { Adapter, AdapterUser, AdapterAccount } from 'next-auth/adapters'
import { prisma } from '@/lib/prisma'

const asAuthUser = (user: { id: string; name: string | null; email: string }): AdapterUser => ({
  id: user.id, name: user.name, email: user.email, image: null, emailVerified: null,
})

/** Only the OAuth + JWT adapter methods are implemented; no session/token tables. */
export function createAuthAdapter(): Adapter {
  return {
    async createUser(data: Omit<AdapterUser, 'id'>) {
      if (!data.email?.trim()) throw new Error('A Google email is required')
      return asAuthUser(await prisma.user.create({ data: { name: data.name ?? null, email: data.email } }))
    },
    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } })
      return user ? asAuthUser(user) : null
    },
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } })
      return user ? asAuthUser(user) : null
    },
    async getUserByAccount(provider_providerAccountId) {
      const account = await prisma.account.findUnique({ where: { provider_providerAccountId }, include: { user: true } })
      return account ? asAuthUser(account.user) : null
    },
    async updateUser({ id, name, email }) {
      if (email !== undefined && !email.trim()) throw new Error('A Google email is required')
      const data = { ...(name !== undefined ? { name } : {}), ...(email !== undefined ? { email } : {}) }
      return asAuthUser(await prisma.user.update({ where: { id }, data }))
    },
    async linkAccount(data: AdapterAccount) {
      // Whitelist provider fields so arbitrary profile properties cannot reach Prisma.
      const { userId, type, provider, providerAccountId, refresh_token, access_token,
        expires_at, token_type, scope, id_token, session_state } = data
      await prisma.account.create({ data: { userId, type, provider, providerAccountId,
        refresh_token, access_token, expires_at, token_type, scope, id_token, session_state } })
    },
    async unlinkAccount(provider_providerAccountId: Pick<AdapterAccount, 'provider' | 'providerAccountId'>) {
      await prisma.account.delete({ where: { provider_providerAccountId } })
    },
  }
}
