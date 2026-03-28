'use client';

import { useState } from 'react';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { getMonthDays, formatMonthYear, addMonths, subMonths, isSameMonth } from '@/lib/utils/dates';
import type { CalendarDay } from '@/types/calendar';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2)); // March 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = formatMonthYear(currentDate).split(' ')[0];

  const monthDays = getMonthDays(year, month);

  // Mock data - replace with API call
  const markedDates = new Set([
    '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-05', '2026-03-06',
    '2026-03-10', '2026-03-11', '2026-03-14', '2026-03-17', '2026-03-18',
    '2026-03-19', '2026-03-20', '2026-03-24', '2026-03-25', '2026-03-26', '2026-03-27'
  ]);

  const days: CalendarDay[] = monthDays.map((date) => {
    if (!date) {
      return { date: null as any, hasRecord: false, isCurrentMonth: false };
    }
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      date,
      hasRecord: markedDates.has(dateStr),
      isCurrentMonth: isSameMonth(date, currentDate),
    };
  });

  return (
    <div className="min-h-screen bg-white p-4 max-w-2xl mx-auto">
      <CalendarHeader
        month={monthName}
        year={year}
        onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
        onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
      />
      <CalendarGrid days={days} />
      <CalendarLegend />
    </div>
  );
}
