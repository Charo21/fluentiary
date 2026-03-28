import { notFound } from 'next/navigation';
import { DayRecordView } from '@/components/record/DayRecordView';

type PageProps = {
  params: Promise<{ date: string }>;
};

export default async function DayPage({ params }: PageProps) {
  const { date } = await params;

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  return <DayRecordView date={date} />;
}
