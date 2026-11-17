import { Fragment, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useCurrentAccount } from '@/common/status'
import { safeCallbackUrl } from '../redirect'

export default function AuthBoundary({ children }: { children: ReactNode }) {
  const { authStatus, account } = useCurrentAccount()
  const router = useRouter()
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      void router.replace(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl(router.asPath))}`)
    }
  }, [authStatus, router])
  if (authStatus !== 'authenticated') return <div className="fl-page"><div className="fl-note">Loading…</div></div>
  return <Fragment key={account.id}>{children}</Fragment>
}
