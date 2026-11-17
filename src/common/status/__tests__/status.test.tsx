/** @jest-environment jsdom */
import { act, render, renderHook, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { useSession } from 'next-auth/react'
import { CommonStatusProvider, useCommonStatus, useCurrentAccount, useLocalClock } from '..'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
const mockSession = useSession as jest.Mock
const user = { id: 'u1', name: 'Alice', email: 'alice@example.com' }
const wrapper = ({ children }: { children: React.ReactNode }) => <CommonStatusProvider>{children}</CommonStatusProvider>

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(2026, 10, 9, 23, 59, 59).getTime())
  mockSession.mockReturnValue({ status: 'authenticated', data: { user } })
})
afterEach(() => jest.useRealTimers())

test('provides local time and advances date across local midnight', () => {
  const { result } = renderHook(useCommonStatus, { wrapper })
  expect(result.current.localNow).toMatch(/^2026-11-09T23:59:59\.000[+-]\d{2}:\d{2}$/)
  expect(result.current.localDate).toBe('2026-11-09')
  act(() => jest.advanceTimersByTime(1000))
  expect(result.current.localDate).toBe('2026-11-10')
  expect(result.current.account).toEqual(user)
})

test('renders no device timestamp on the server', () => {
  function Clock() { return <span>{useLocalClock().localNow ?? 'waiting'}</span> }
  expect(renderToString(<CommonStatusProvider><Clock /></CommonStatusProvider>)).toBe('<span>waiting</span>')
})

test('reads real current time on visibility resume and clears its timer on unmount', () => {
  const { result, unmount } = renderHook(useLocalClock, { wrapper })
  act(() => {
    jest.setSystemTime(new Date(2026, 10, 12, 3, 4, 5).getTime())
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(result.current.localNow).toMatch(/^2026-11-12T03:04:05\.000[+-]\d{2}:\d{2}$/)
  unmount()
  expect(jest.getTimerCount()).toBe(0)
})

test('does not render an account-only consumer on clock ticks', () => {
  let renders = 0
  function Account() { renders++; return <span>{useCurrentAccount().account?.email}</span> }
  render(<CommonStatusProvider><Account /></CommonStatusProvider>)
  const before = renders
  act(() => jest.advanceTimersByTime(5000))
  expect(renders).toBe(before)
  expect(screen.getByText('alice@example.com')).toBeInTheDocument()
})

test('tracks loading, account changes and logout without stale account state', () => {
  mockSession.mockReturnValue({ status: 'loading', data: null })
  const { result, rerender } = renderHook(useCurrentAccount, { wrapper })
  expect(result.current).toEqual({ authStatus: 'loading', account: null })
  mockSession.mockReturnValue({ status: 'authenticated', data: { user } })
  rerender()
  expect(result.current.account?.id).toBe('u1')
  mockSession.mockReturnValue({ status: 'authenticated', data: { user: { ...user, id: 'u2' } } })
  rerender()
  expect(result.current.account?.id).toBe('u2')
  mockSession.mockReturnValue({ status: 'unauthenticated', data: null })
  rerender()
  expect(result.current).toEqual({ authStatus: 'unauthenticated', account: null })
})

test('does not expose an authenticated account without its internal ID', () => {
  mockSession.mockReturnValue({ status: 'authenticated', data: { user: { email: 'x@example.com' } } })
  const { result } = renderHook(useCurrentAccount, { wrapper })
  expect(result.current).toEqual({ authStatus: 'unauthenticated', account: null })
})
