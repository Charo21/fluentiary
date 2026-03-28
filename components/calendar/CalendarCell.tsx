'use client';

import { cn } from '@/lib/utils/cn';
import { isToday, formatDate } from '@/lib/utils/dates';
import Link from 'next/link';

type CalendarCellProps = {
  date: Date | null;
  hasRecord: boolean;
  isCurrentMonth: boolean;
};

export function CalendarCell({ date, hasRecord, isCurrentMonth }: CalendarCellProps) {
  if (!date) {
    return <div className="aspect-square" />;
  }

  const today = isToday(date);
  const dateStr = formatDate(date);

  return (
    <Link
      href={hasRecord ? `/day/${dateStr}` : `/new?date=${dateStr}`}
      className={cn(
        'aspect-square flex items-center justify-center relative rounded transition-colors',
        hasRecord && 'bg-green-50',
        today && 'ring-2 ring-green-700',
        !isCurrentMonth && 'text-gray-300',
        isCurrentMonth && !hasRecord && 'hover:bg-gray-50'
      )}
    >
      <span className={cn('text-sm', !isCurrentMonth && 'text-gray-400')}>
        {date.getDate()}
      </span>
      {hasRecord && (
        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-green-600" />
      )}
    </Link>
  );
}
