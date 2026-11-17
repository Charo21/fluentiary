/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { useCurrentAccount } from '@/common/status'
import { useDailyRecord } from '../useDailyRecord'

jest.mock('@/common/status', () => ({ useCurrentAccount: jest.fn() }))
jest.mock('@/features/auth/hooks/useSessionExpired', () => ({ useSessionExpired: () => mockExpired }))
const mockExpired = jest.fn()
const account = useCurrentAccount as jest.Mock
const day = '2026-11-09'
const ok = (record: unknown) => ({ ok: true, status: 200, json: async () => ({ record }) })
const loaded = { keyPoints: 'existing private text', freeWrite: 'draft', refinedText: null }

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(Date.parse('2026-11-09T12:00:00Z'))
  jest.clearAllMocks()
  account.mockReturnValue({ authStatus: 'authenticated', account: { id: 'alice', email: 'a@example.com', name: null } })
  global.fetch = jest.fn()
})
afterEach(() => jest.useRealTimers())

test('never auto-saves an empty draft while initial data is loading', async () => {
  ;(fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
  renderHook(() => useDailyRecord(day))
  await act(async () => { await jest.advanceTimersByTimeAsync(2000) })
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: 'PUT' }))
})

test('saves an edit only after loading completes', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce(ok(loaded)).mockResolvedValue(ok(loaded))
  const { result } = renderHook(() => useDailyRecord(day))
  await act(async () => {})
  expect(result.current.keyPoints).toBe('existing private text')
  act(() => result.current.setKeyPoints('my edit'))
  await act(async () => { await jest.advanceTimersByTimeAsync(1000) })
  expect(fetch).toHaveBeenLastCalledWith('/api/records/2026-11-09', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ keyPoints: 'my edit', freeWrite: 'draft', refinedText: undefined }) }))
})

test('cancels pending save and clears private state when account changes', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce(ok(loaded)).mockResolvedValue(ok(null))
  const { result, rerender } = renderHook(() => useDailyRecord(day))
  await act(async () => {})
  act(() => result.current.setKeyPoints('alice unsaved'))
  account.mockReturnValue({ authStatus: 'authenticated', account: { id: 'bob', email: 'b@example.com', name: null } })
  rerender()
  await act(async () => { await jest.advanceTimersByTimeAsync(2000) })
  expect(result.current.keyPoints).toBe('')
  expect((fetch as jest.Mock).mock.calls.filter(([, options]) => options?.method === 'PUT')).toHaveLength(0)
})

test('ignores a stale date response and starts the new date with a blank draft', async () => {
  let resolveOld!: (value: unknown) => void
  ;(fetch as jest.Mock).mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve })).mockResolvedValue(ok(null))
  const { result, rerender } = renderHook(({ date }) => useDailyRecord(date), { initialProps: { date: '2026-11-08' } })
  rerender({ date: day })
  await act(async () => { resolveOld(ok(loaded)) })
  expect(result.current.keyPoints).toBe('')
  expect(result.current.loading).toBe(false)
})

test('stops saving and ends the session after an unauthorized response', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 })
  renderHook(() => useDailyRecord(day))
  await act(async () => { await jest.advanceTimersByTimeAsync(2000) })
  expect(mockExpired).toHaveBeenCalled()
  expect((fetch as jest.Mock).mock.calls.filter(([, options]) => options?.method === 'PUT')).toHaveLength(0)
})

test('cancels a pending save on logout', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(ok(loaded))
  const { result, rerender } = renderHook(() => useDailyRecord(day))
  await act(async () => {})
  act(() => result.current.setKeyPoints('pending edit'))
  account.mockReturnValue({ authStatus: 'unauthenticated', account: null })
  rerender()
  await act(async () => { await jest.advanceTimersByTimeAsync(2000) })
  expect(result.current.keyPoints).toBe('')
  expect((fetch as jest.Mock).mock.calls.filter(([, options]) => options?.method === 'PUT')).toHaveLength(0)
})


test('allows editing on the local date even when UTC is on a different date', async () => {
  jest.setSystemTime(new Date(2026, 10, 9, 23, 30).getTime())
  ;(fetch as jest.Mock).mockResolvedValue(ok(null))
  const { result } = renderHook(() => useDailyRecord('2026-11-09'))
  await act(async () => {})
  expect(result.current.isToday).toBe(true)
  expect(result.current.readOnly).toBe(false)
})
