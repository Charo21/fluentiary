import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, isBefore, startOfDay } from 'date-fns'

interface CalendarProps {
  recordDates: string[] // ISO date strings (YYYY-MM-DD)
  onDateClick: (date: string) => void
}

export default function Calendar({ recordDates, onDateClick }: CalendarProps) {
  const recordDateSet = new Set(recordDates)
  const today = new Date()
  const todayString = format(today, 'yyyy-MM-dd')
  const todayStart = startOfDay(today)

  const modifiers = {
    hasRecord: (date: Date) => {
      const dateString = format(date, 'yyyy-MM-dd')
      return recordDateSet.has(dateString)
    },
    disabled: (date: Date) => {
      const dateString = format(date, 'yyyy-MM-dd')
      const hasRecord = recordDateSet.has(dateString)
      const isPast = isBefore(date, todayStart)

      // Disable past dates without records
      return isPast && !hasRecord
    },
  }

  const modifiersClassNames = {
    hasRecord: 'has-record',
    disabled: 'disabled-date',
  }

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return

    const dateString = format(date, 'yyyy-MM-dd')
    const hasRecord = recordDateSet.has(dateString)
    const isToday = dateString === todayString

    // Only allow clicking dates with records or today
    if (hasRecord || isToday) {
      onDateClick(dateString)
    }
  }

  return (
    <div className="calendar-container" aria-label="Calendar for viewing and selecting practice dates">
      <style jsx global>{`
        .has-record {
          position: relative;
        }
        .has-record::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #10b981;
        }
        .disabled-date {
          opacity: 0.5;
          color: #9ca3af;
          cursor: not-allowed;
        }
        .disabled-date:hover {
          background-color: transparent;
        }
      `}</style>
      <DayPicker
        mode="single"
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        showOutsideDays={false}
      />
    </div>
  )
}
