'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type CalendarHeaderProps = {
  month: string;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function CalendarHeader({
  month,
  year,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold">{month}</h1>
        <p className="text-lg text-gray-600">{year}</p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={onPrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onNextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
