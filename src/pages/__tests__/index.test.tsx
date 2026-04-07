/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import Home from '../index'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

global.fetch = jest.fn()

describe('Home Page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('should render calendar with fetched record dates', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dates: ['2024-01-15', '2024-01-20'] }),
    })

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByLabelText(/calendar/i)).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/records/list')
  })

  it('should show empty state when no records exist', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dates: [] }),
    })

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText(/click today's date to start writing/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load records/i)).toBeInTheDocument()
    })
  })
})
