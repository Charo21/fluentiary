import { format } from 'date-fns'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import type { AccountStatus, CommonStatus, LocalClock } from './types'

const AccountContext = createContext<AccountStatus | undefined>(undefined)
const ClockContext = createContext<LocalClock | undefined>(undefined)

function LocalClockProvider({ children }: { children: ReactNode }) {
  const [localNow, setUtcNow] = useState<string | null>(null)
  useEffect(() => {
    const refresh = () => setUtcNow(format(new Date(Date.now()), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"))
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    refresh()
    const timer = window.setInterval(refresh, 1000)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  const value = useMemo(() => ({ localNow, localDate: localNow?.slice(0, 10) ?? null }), [localNow])
  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>
}

export function CommonStatusProvider({ children }: { children: ReactNode }) {
  const { status, data } = useSession()
  const user = data?.user
  const id = user?.id, email = user?.email, name = user?.name ?? null
  const value = useMemo<AccountStatus>(() => {
    if (status === 'loading') return { authStatus: 'loading', account: null }
    if (status === 'authenticated' && id && email) {
      return { authStatus: 'authenticated', account: { id, name, email } }
    }
    return { authStatus: 'unauthenticated', account: null }
  }, [status, id, email, name])
  return <AccountContext.Provider value={value}><LocalClockProvider>{children}</LocalClockProvider></AccountContext.Provider>
}

export function useCurrentAccount(): AccountStatus {
  const value = useContext(AccountContext)
  if (!value) throw new Error('useCurrentAccount requires CommonStatusProvider')
  return value
}
export function useLocalClock(): LocalClock {
  const value = useContext(ClockContext)
  if (!value) throw new Error('useLocalClock requires CommonStatusProvider')
  return value
}
export function useCommonStatus(): CommonStatus {
  const account = useCurrentAccount()
  const clock = useLocalClock()
  return useMemo(() => ({ ...account, ...clock }), [account, clock])
}
