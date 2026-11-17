import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './options'
import { safeCallbackUrl } from '../redirect'

export async function getAccount(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const user = session?.user
  return user?.id && user.email ? { id: user.id, name: user.name ?? null, email: user.email } : null
}

export async function requirePageSession(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session?.user?.id || !session.user.email) {
    return { redirect: {
      destination: `/login?callbackUrl=${encodeURIComponent(safeCallbackUrl(context.resolvedUrl))}`,
      permanent: false as const,
    } }
  }
  return { props: { session } }
}
