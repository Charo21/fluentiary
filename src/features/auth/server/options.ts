import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createAuthAdapter } from './adapter'
import { safeCallbackUrl } from '../redirect'

export const authOptions: NextAuthOptions = {
  adapter: createAuthAdapter(),
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || '',
    profile(profile) {
      return { id: profile.sub, name: profile.name ?? null, email: profile.email, image: null }
    },
  })],
  callbacks: {
    async signIn({ account, user }) {
      return account?.provider === 'google' && !!account.providerAccountId && !!user.email?.trim()
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
      }
      delete token.picture
      return token
    },
    async session({ session, token }) {
      if (token.sub && token.email) {
        session.user = { id: token.sub, email: token.email, name: token.name ?? null }
      } else {
        delete session.user
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      let path = url
      try {
        const target = new URL(url, baseUrl)
        if (target.origin !== new URL(baseUrl).origin) return baseUrl
        path = target.pathname + target.search
      } catch { return baseUrl }
      return new URL(safeCallbackUrl(path), baseUrl).toString()
    },
  },
}
