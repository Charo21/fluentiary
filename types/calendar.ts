export type CalendarStats = {
  streak: number;
  daysWritten: number;
  avgWords: number;
};

export type CalendarDay = {
  date: Date;
  hasRecord: boolean;
  isCurrentMonth: boolean;
};
