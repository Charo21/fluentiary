/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { signIn, signOut } from 'next-auth/react'
import { useCurrentAccount } from '@/common/status'
import LoginPage from '../LoginPage'
import AccountMenu from '../AccountMenu'
import AuthBoundary from '../AuthBoundary'

jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('next-auth/react', () => ({ signIn: jest.fn(), signOut: jest.fn() }))
jest.mock('@/common/status', () => ({ useCurrentAccount: jest.fn() }))
const account = useCurrentAccount as jest.Mock
const replace = jest.fn()
beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ query: {}, asPath: '/record/2026-11-09', replace })
  account.mockReturnValue({ authStatus: 'unauthenticated', account: null })
  ;(signIn as jest.Mock).mockResolvedValue(undefined)
  ;(signOut as jest.Mock).mockResolvedValue({ url: '/login' })
})
test('starts Google login with the original application destination', () => {
  ;(useRouter as jest.Mock).mockReturnValue({ query: { callbackUrl: '/record/2026-11-09' }, replace })
  render(<LoginPage />)
  fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
  expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/record/2026-11-09' })
})
test('shows a safe login error without rendering raw provider details', () => {
  ;(useRouter as jest.Mock).mockReturnValue({ query: { error: 'secret-provider-details' }, replace })
  render(<LoginPage />)
  expect(screen.getByRole('alert')).toHaveTextContent(/sign in/i)
  expect(screen.queryByText('secret-provider-details')).not.toBeInTheDocument()
})
test('shows current account and logs out', async () => {
  account.mockReturnValue({ authStatus: 'authenticated', account: { id: 'u1', name: 'Alice', email: 'a@example.com' } })
  render(<AccountMenu />)
  expect(screen.getByText('Alice')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
  expect(signOut).toHaveBeenCalledWith({ redirect: false })
})
test('never renders protected content while signed out and requests login', async () => {
  render(<AuthBoundary><div>Private journal</div></AuthBoundary>)
  expect(screen.queryByText('Private journal')).not.toBeInTheDocument()
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?callbackUrl=%2Frecord%2F2026-11-09'))
})
test('unmounts private content when the session is lost', () => {
  account.mockReturnValue({ authStatus: 'authenticated', account: { id: 'u1', email: 'a@example.com', name: null } })
  const { rerender } = render(<AuthBoundary><div>Private journal</div></AuthBoundary>)
  expect(screen.getByText('Private journal')).toBeInTheDocument()
  account.mockReturnValue({ authStatus: 'unauthenticated', account: null })
  rerender(<AuthBoundary><div>Private journal</div></AuthBoundary>)
  expect(screen.queryByText('Private journal')).not.toBeInTheDocument()
})
