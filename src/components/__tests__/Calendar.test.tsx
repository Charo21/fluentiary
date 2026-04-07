/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { format, subDays } from 'date-fns'
import Calendar from '../Calendar'

describe('Calendar', () => {
  it('should render calendar', () => {
    render(<Calendar recordDates={[]} onDateClick={() => {}} />)

    const today = new Date()
    const monthName = today.toLocaleString('default', { month: 'long' })

    expect(screen.getByText(new RegExp(monthName, 'i'))).toBeInTheDocument()
  })

  it('should show green dots for specific record dates', () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const recordDates = [`${year}-${month}-15`, `${year}-${month}-20`]

    const { container } = render(
      <Calendar recordDates={recordDates} onDateClick={() => {}} />
    )

    const daysWithRecords = container.querySelectorAll('.has-record')
    expect(daysWithRecords.length).toBe(2)
  })

  it('should disable past dates without records', () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')

    // Only add a record for today, not for past dates
    const recordDates = [format(today, 'yyyy-MM-dd')]

    const { container } = render(
      <Calendar recordDates={recordDates} onDateClick={() => {}} />
    )

    const disabledDates = container.querySelectorAll('.disabled-date')
    expect(disabledDates.length).toBeGreaterThan(0)
  })

  it('should not disable today even without a record', () => {
    const today = new Date()
    const { container } = render(
      <Calendar recordDates={[]} onDateClick={() => {}} />
    )

    const disabledDates = container.querySelectorAll('.disabled-date')
    // Today should not be in the disabled dates
    const todayElement = Array.from(disabledDates).some(el => {
      const text = el.textContent
      return text === String(today.getDate())
    })
    expect(todayElement).toBe(false)
  })

  it('should not disable past dates with records', () => {
    const today = new Date()
    const pastDate = subDays(today, 5)
    const pastDateString = format(pastDate, 'yyyy-MM-dd')
    const recordDates = [pastDateString]

    const { container } = render(
      <Calendar recordDates={recordDates} onDateClick={() => {}} />
    )

    const disabledDates = container.querySelectorAll('.disabled-date')
    const pastDateElement = Array.from(disabledDates).some(el => {
      const text = el.textContent
      return text === String(pastDate.getDate())
    })
    expect(pastDateElement).toBe(false)
  })

  it('should call onDateClick when date is clicked', () => {
    const mockOnClick = jest.fn()
    const today = new Date()
    const todayString = format(today, 'yyyy-MM-dd')

    const { container } = render(
      <Calendar recordDates={[todayString]} onDateClick={mockOnClick} />
    )

    // Find today's date button and click it
    const dateButtons = container.querySelectorAll('button')
    const todayButton = Array.from(dateButtons).find(
      btn => btn.textContent === String(today.getDate())
    )

    expect(todayButton).toBeDefined()
    if (todayButton) {
      fireEvent.click(todayButton)
      expect(mockOnClick).toHaveBeenCalledWith(todayString)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    }
  })
})
