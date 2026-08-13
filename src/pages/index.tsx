import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Calendar from '@/components/Calendar'

export default function Home() {
  const router = useRouter()
  const [recordDates, setRecordDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecordDates() {
      try {
        const response = await fetch('/api/records/list')
        if (!response.ok) {
          throw new Error('Failed to fetch records')
        }
        const data = await response.json()
        setRecordDates(data.dates)
      } catch (err) {
        console.error('Error fetching record dates:', err)
        setError('Failed to load records. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchRecordDates()
  }, [])

  const handleDateClick = (date: string) => {
    router.push(`/record/${date}`)
  }

  return (
    <>
      <Head>
        <title>Fluentiary — Calendar</title>
      </Head>

      <div className="fl-page">
        <div className="fl-wordmark">Fluentiary</div>

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
