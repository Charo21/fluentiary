'use client';

import type { CalendarStats } from '@/types/calendar';

type CalendarStatsProps = {
  stats: CalendarStats;
};

export function CalendarStatsBar({ stats }: CalendarStatsProps) {
  return (
    <div className="flex gap-16 mb-12">
      <div>
        <div className="text-4xl font-bold text-orange-500">{stats.streak}</div>
        <div className="text-sm">day streak</div>
      </div>
      <div>
        <div className="text-4xl font-bold text-green-600">{stats.daysWritten}</div>
        <div className="text-sm">days written</div>
      </div>
      <div>
        <div className="text-4xl font-bold text-blue-500">{stats.avgWords}</div>
        <div className="text-sm">avg words/day</div>
      </div>
    </div>
  );
}
