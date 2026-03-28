'use client';

export function CalendarLegend() {
  return (
    <div className="flex gap-6 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-green-50 rounded" />
        <span>Written</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 ring-2 ring-green-700 rounded" />
        <span>Today</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-white rounded" />
        <span>No entry</span>
      </div>
    </div>
  );
}
