/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import RecordPage from '../../../pages/record/[date]'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

global.fetch = jest.fn()

describe('Record Detail Page', () => {
  const mockPush = jest.fn()
  const mockQuery = { date: '2024-01-15' }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      query: mockQuery,
      push: mockPush,
    })
  })

  it('should render record with all three blocks', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        record: {
          id: '1',
          date: '2024-01-15',
          keyPoints: 'Test key points',
          freeWrite: 'Test free write',
          refinedText: 'Test refined text',
          isComplete: true,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
      }),
    })

    render(<RecordPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test key points')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test free write')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test refined text')).toBeInTheDocument()
    })
  })

  it('should show Refine button for today', async () => {
    const today = new Date().toISOString().split('T')[0]
    ;(useRouter as jest.Mock).mockReturnValue({
      query: { date: today },
      push: mockPush,
    })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: null }),
    })

    render(<RecordPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refine/i })).toBeInTheDocument()
    })
  })

  it('should not show Refine button for past dates', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        record: {
          id: '1',
          date: '2024-01-15',
          keyPoints: 'Test',
          freeWrite: 'Test',
          refinedText: null,
          isComplete: false,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
      }),
    })

    render(<RecordPage />)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /refine/i })).not.toBeInTheDocument()
    })
  })

  it('should navigate back to calendar', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ record: null }),
    })

    render(<RecordPage />)

    await waitFor(() => {
      const backButton = screen.getByText(/back to calendar/i)
      fireEvent.click(backButton)
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
