import { useEffect, useState } from 'react'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Fluentiary
        </h1>

        {recordDates.length === 0 ? (
          <div className="text-center text-gray-600 mb-8">
            Click today's date to start writing
          </div>
        ) : null}

        <div className="bg-white rounded-lg shadow-md p-6">
          <Calendar recordDates={recordDates} onDateClick={handleDateClick} />
        </div>
      </div>
    </div>
  )
}
