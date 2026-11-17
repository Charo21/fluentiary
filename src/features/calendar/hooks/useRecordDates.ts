import { useEffect, useState } from 'react'
import { useCurrentAccount } from '@/common/status'
import { useSessionExpired } from '@/features/auth/hooks/useSessionExpired'

export function useRecordDates() {
  const { account } = useCurrentAccount()
  const userId = account?.id ?? ''
  const expireSession = useSessionExpired()
  const [state, setState] = useState({ userId: '', recordDates: [] as string[], loading: true, error: null as string | null })

  useEffect(() => {
    const controller = new AbortController()
    setState({ userId, recordDates: [], loading: !!userId, error: null })
    if (userId) void (async () => {
      try {
        const response = await fetch('/api/records/list', { signal: controller.signal })
        if (controller.signal.aborted) return
        if (response.status === 401) { expireSession(); return }
        if (!response.ok) throw new Error('Failed to fetch records')
        const data = await response.json()
        if (!controller.signal.aborted) setState({ userId, recordDates: data.dates, loading: false, error: null })
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching record dates:', error)
          setState({ userId, recordDates: [], loading: false, error: 'Failed to load records. Please refresh the page.' })
        }
      }
    })()
    return () => controller.abort()
  }, [userId, expireSession])

  return state.userId === userId ? state : { recordDates: [], loading: true, error: null }
}
