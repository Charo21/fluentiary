import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface CalendarProps {
  recordDates: string[] // ISO date strings (YYYY-MM-DD)
  onDateClick: (date: string) => void
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const toKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const keyOf = (date: Date) => toKey(date.getFullYear(), date.getMonth(), date.getDate())

export default function Calendar({ recordDates, onDateClick }: CalendarProps) {
  const recordSet = useMemo(() => new Set(recordDates), [recordDates])

  // Frozen at mount so a long-lived tab keeps a stable notion of "today".
  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])
  const todayKey = keyOf(today)

  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selected, setSelected] = useState(todayKey)

  const gridRef = useRef<HTMLDivElement>(null)
  const focusPending = useRef(false)

  const isCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth()

  // Consecutive days written, counting back from today. If today has not been
  // written yet the streak is measured from yesterday, so it only breaks after
  // a full day is missed.
  const streak = useMemo(() => {
    const cursor = new Date(today)
    if (!recordSet.has(todayKey)) cursor.setDate(cursor.getDate() - 1)

    let count = 0
    while (recordSet.has(keyOf(cursor))) {
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [recordSet, today, todayKey])

  const days = useMemo(() => {
    const leading = new Date(view.y, view.m, 1).getDay()
    const total = new Date(view.y, view.m + 1, 0).getDate()

    return Array.from({ length: total }, (_, i) => {
      const day = i + 1
      const key = toKey(view.y, view.m, day)
      const date = new Date(view.y, view.m, day)

      return {
        day,
        key,
        leading: i === 0 ? leading : 0,
        hasRecord: recordSet.has(key),
        isToday: key === todayKey,
        isFuture: date.getTime() > today.getTime(),
      }
    })
  }, [view, recordSet, today, todayKey])

  const leadingBlanks = days.length > 0 ? days[0].leading : 0

  useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    gridRef.current?.querySelector<HTMLElement>('.is-selected')?.focus()
  }, [selected, view])

  const goToMonth = useCallback((delta: number) => {
    setView((prev) => {
      const next = new Date(prev.y, prev.m + delta, 1)
      return { y: next.getFullYear(), m: next.getMonth() }
    })
  }, [])

  const handleSelect = (key: string, openable: boolean) => {
    setSelected(key)
    if (openable) onDateClick(key)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
    if (!step) return
    event.preventDefault()

    const [y, m, d] = selected.split('-').map(Number)
    const next = new Date(y, m - 1, d)
    next.setDate(next.getDate() + step)
    if (next.getTime() > today.getTime()) return

    focusPending.current = true
    setView({ y: next.getFullYear(), m: next.getMonth() })
    setSelected(keyOf(next))
  }

  return (
    <div aria-label="Calendar for viewing and selecting practice dates">
      <div className="fl-cal-head">
        <div className="fl-cal-head__left">
          <h1 className="fl-month">
            {MONTHS[view.m]} <span className="fl-month__year">{view.y}</span>
          </h1>
          {streak > 0 && (
            <span className="fl-streak" title="Consecutive days written">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.4 2.2c.3 3.2-1.6 4.6-3 6.1-1.5 1.6-3 3.3-3 6.1 0 3.6 2.9 6.5 6.5 6.5s6.5-2.9 6.5-6.5c0-2.4-1-4.2-2-5.6-.3.9-.9 1.6-1.8 1.9.5-2.9-.6-6-3.7-8.5Z" />
              </svg>
              <span>
                <b>{streak}</b>-day streak
              </span>
            </span>
          )}
        </div>

        <div className="fl-nav">
          <button
            type="button"
            className="fl-btn fl-btn--icon"
            aria-label="Previous month"
            onClick={() => goToMonth(-1)}
          >
            &lsaquo;
          </button>
          <button
            type="button"
            className="fl-btn fl-btn--text"
            onClick={() => {
              setView({ y: today.getFullYear(), m: today.getMonth() })
              setSelected(todayKey)
            }}
          >
            Today
          </button>
          <button
            type="button"
            className="fl-btn fl-btn--icon"
            aria-label="Next month"
            disabled={isCurrentMonth}
            onClick={() => goToMonth(1)}
          >
            &rsaquo;
          </button>
        </div>
      </div>

      <div className="fl-dow" aria-hidden="true">
        {WEEKDAYS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div
        className="fl-grid"
        role="grid"
        aria-label="Days"
        ref={gridRef}
        onKeyDown={handleKeyDown}
      >
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} className="fl-cell fl-cell--blank" />
        ))}

        {days.map(({ day, key, hasRecord, isToday, isFuture }) => {
          // Only today (always writable) and days that already hold an entry
          // can be opened. Empty past days have nothing to show.
          const openable = isToday || hasRecord
          const classes = [
            'fl-cell',
            hasRecord ? 'has-record' : '',
            isToday ? 'is-today' : '',
            isFuture ? 'is-future' : '',
            !isToday && !isFuture && !hasRecord ? 'disabled-date' : '',
            key === selected ? 'is-selected' : '',
          ]
            .filter(Boolean)
            .join(' ')

          const label = isToday
            ? `${MONTHS[view.m]} ${day}, today, editable`
            : isFuture
              ? `${MONTHS[view.m]} ${day}, upcoming`
              : hasRecord
                ? `${MONTHS[view.m]} ${day}, entry, view only`
                : `${MONTHS[view.m]} ${day}, no entry`

          if (isFuture) {
            return (
              <div key={key} className={classes} role="gridcell" aria-label={label}>
                <span className="fl-cell__num">{day}</span>
                <span className="fl-cell__dot" />
              </div>
            )
          }

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              className={classes}
              aria-label={label}
              aria-disabled={openable ? undefined : true}
              style={{ animationDelay: `${day * 8}ms` }}
              onClick={() => handleSelect(key, openable)}
            >
              <span className="fl-cell__num">{day}</span>
              <span className="fl-cell__dot" />
            </button>
          )
        })}
      </div>

      <div className="fl-foot">
        <div className="fl-legend">
          <span className="fl-legend__item">
            <span className="fl-legend__key fl-legend__key--edit" />
            Today &middot; editable
          </span>
          <span className="fl-legend__item">
            <span className="fl-legend__key fl-legend__key--view" />
            Past entry &middot; view only
          </span>
        </div>
      </div>
    </div>
  )
}
