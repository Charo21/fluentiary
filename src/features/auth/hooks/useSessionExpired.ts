import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { signOut } from 'next-auth/react'
import { safeCallbackUrl } from '../redirect'

export function useSessionExpired() {
  const router = useRouter()
  return useCallback(() => {
    const destination = `/login?callbackUrl=${encodeURIComponent(safeCallbackUrl(router.asPath))}`
    void signOut({ redirect: false }).catch(() => undefined).then(() => router.replace(destination))
  }, [router])
}
