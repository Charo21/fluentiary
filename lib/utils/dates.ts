import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';

export function getMonthDays(year: number, month: number) {
  const date = new Date(year, month);
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  const days = eachDayOfInterval({ start, end });
  const startDay = getDay(start);

  const prevMonthDays = Array(startDay).fill(null);

  return [...prevMonthDays, ...days];
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export { isToday, isSameMonth, addMonths, subMonths };
