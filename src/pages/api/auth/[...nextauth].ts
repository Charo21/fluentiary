import NextAuth from 'next-auth'
import { authOptions } from '@/features/auth/server/options'

export default NextAuth(authOptions)
