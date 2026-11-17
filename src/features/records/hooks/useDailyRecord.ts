import { format } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCurrentAccount } from '@/common/status'
import { useSessionExpired } from '@/features/auth/hooks/useSessionExpired'

const emptyDraft = (key: string) => ({
  key, keyPoints: '', freeWrite: '', refinedText: '',
  loading: !!key, refining: false, dirty: false, error: null as string | null,
})
type Draft = ReturnType<typeof emptyDraft>
type Field = 'keyPoints' | 'freeWrite' | 'refinedText'

export function useDailyRecord(date: string | string[] | undefined) {
  const { account } = useCurrentAccount()
  const expireSession = useSessionExpired()
  const dateValue = typeof date === 'string' ? date : ''
  const key = account && dateValue ? JSON.stringify([account.id, dateValue]) : ''
  const scope = useRef(key)
  scope.current = key
  const refinement = useRef<AbortController | null>(null)
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(key))
  // Do not expose the previous account/date even for the render before effects run.
  const current = draft.key === key ? draft : emptyDraft(key)
  const isToday = dateValue === format(new Date(), 'yyyy-MM-dd')

  const expire = useCallback(() => {
    setDraft({ ...emptyDraft(key), loading: false, error: 'Please sign in again.' })
    expireSession()
  }, [key, expireSession])

  useEffect(() => {
    const controller = new AbortController()
    setDraft(emptyDraft(key))
    refinement.current?.abort()
    if (key) {
      void (async () => {
        try {
          const response = await fetch(`/api/records/${dateValue}`, { signal: controller.signal })
          if (controller.signal.aborted || scope.current !== key) return
          if (response.status === 401) { expire(); return }
          if (!response.ok) throw new Error('Failed to fetch record')
          const data = await response.json()
          if (controller.signal.aborted || scope.current !== key) return
          setDraft({ ...emptyDraft(key), loading: false,
            keyPoints: data.record?.keyPoints ?? '', freeWrite: data.record?.freeWrite ?? '',
            refinedText: data.record?.refinedText ?? '',
          })
        } catch (error) {
          if (!controller.signal.aborted && scope.current === key) {
            console.error('Error fetching record:', error)
            setDraft({ ...emptyDraft(key), loading: false, error: 'Failed to load record' })
          }
        }
      })()
    }
    return () => { controller.abort(); refinement.current?.abort() }
  }, [key, dateValue, expire])

  const { keyPoints, freeWrite, refinedText, loading, dirty, error } = current
  useEffect(() => {
    if (!key || draft.key !== key || loading || error || !dirty || !isToday) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/records/${dateValue}`, {
          method: 'PUT', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyPoints, freeWrite, refinedText: refinedText || undefined }),
        })
        if (controller.signal.aborted || scope.current !== key) return
        if (response.status === 401) { expire(); return }
        if (!response.ok) throw new Error('Failed to save record')
      } catch (error) {
        if (!controller.signal.aborted && scope.current === key) console.error('Auto-save failed:', error)
      }
    }, 1000)
    return () => { clearTimeout(timer); controller.abort() }
  }, [key, draft.key, dateValue, loading, dirty, error, isToday, keyPoints, freeWrite, refinedText, expire])

  const update = useCallback((field: Field, value: string) => {
    setDraft(previous => previous.key === key && !previous.loading && !previous.error && isToday
      ? { ...previous, [field]: value, dirty: true } : previous)
  }, [key, isToday])
  const setKeyPoints = useCallback((value: string) => update('keyPoints', value), [update])
  const setFreeWrite = useCallback((value: string) => update('freeWrite', value), [update])
  const setRefinedText = useCallback((value: string) => update('refinedText', value), [update])

  async function handleRefine() {
    if (!key || loading || error || !isToday || current.refining) return
    if (!freeWrite.trim()) { alert('Please write something in Free Write before refining'); return }
    const controller = new AbortController()
    refinement.current?.abort()
    refinement.current = controller
    setDraft(previous => ({ ...previous, refining: true }))
    try {
      const response = await fetch('/api/refine', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: freeWrite }),
      })
      if (controller.signal.aborted || scope.current !== key) return
      if (response.status === 401) { expire(); return }
      if (!response.ok) throw new Error('Refinement failed')
      const data = await response.json()
      if (!controller.signal.aborted && scope.current === key) setRefinedText(data.refinedText)
    } catch (error) {
      if (!controller.signal.aborted && scope.current === key) {
        console.error('Error refining text:', error)
        alert('Failed to refine text. Please try again.')
      }
    } finally {
      if (!controller.signal.aborted && scope.current === key) setDraft(previous => ({ ...previous, refining: false }))
    }
  }

  return {
    keyPoints, setKeyPoints, freeWrite, setFreeWrite, refinedText, setRefinedText,
    loading, refining: current.refining, error, isToday,
    readOnly: !isToday || loading || !!error, handleRefine,
  }
}
