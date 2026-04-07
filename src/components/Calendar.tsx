import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format } from 'date-fns'

interface CalendarProps {
  recordDates: string[] // ISO date strings (YYYY-MM-DD)
  onDateClick: (date: string) => void
}

export default function Calendar({ recordDates, onDateClick }: CalendarProps) {
  const recordDateSet = new Set(recordDates)
  const today = new Date()
  const todayString = format(today, 'yyyy-MM-dd')

  const modifiers = {
    hasRecord: (date: Date) => {
      const dateString = format(date, 'yyyy-MM-dd')
      return recordDateSet.has(dateString)
    },
  }

  const modifiersClassNames = {
    hasRecord: 'has-record',
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
    <div className="calendar-container">
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
      `}</style>
      <DayPicker
        mode="single"
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
      />
    </div>
  )
}
