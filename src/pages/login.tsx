import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/features/auth/server/options'
import { safeCallbackUrl } from '@/features/auth/redirect'
export { default } from '@/features/auth/components/LoginPage'

export const getServerSideProps: GetServerSideProps = async context => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (session?.user?.id && session.user.email) {
    return { redirect: { destination: safeCallbackUrl(context.query.callbackUrl), permanent: false } }
  }
  return { props: { session: null } }
}
