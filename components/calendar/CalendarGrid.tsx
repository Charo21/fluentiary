'use client';

import { CalendarCell } from './CalendarCell';
import type { CalendarDay } from '@/types/calendar';

type CalendarGridProps = {
  days: CalendarDay[];
};

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function CalendarGrid({ days }: CalendarGridProps) {
  return (
    <div className="mb-4">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <CalendarCell
            key={idx}
            date={day.date}
            hasRecord={day.hasRecord}
            isCurrentMonth={day.isCurrentMonth}
          />
        ))}
      </div>
    </div>
  );
}
