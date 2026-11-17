import JournalHeader from '@/features/auth/components/JournalHeader'
import { useRecordDates } from '../hooks/useRecordDates'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Calendar from '@/features/calendar/components/Calendar'

export default function Home() {
  const router = useRouter()
  const { recordDates, loading, error } = useRecordDates()

  const handleDateClick = (date: string) => {
    router.push(`/record/${date}`)
  }

  return (
    <>
      <Head>
        <title>Fluentiary — Calendar</title>
      </Head>

      <div className="fl-page">
        <JournalHeader />

        {loading ? (
          <div className="fl-note">Loading…</div>
        ) : error ? (
          <div className="fl-note fl-note--error">{error}</div>
        ) : (
          <main className="fl-card">
            {recordDates.length === 0 && (
              <div className="fl-note">Click today&apos;s date to start writing</div>
            )}
            <Calendar recordDates={recordDates} onDateClick={handleDateClick} />
          </main>
        )}
      </div>
    </>
  )
}
