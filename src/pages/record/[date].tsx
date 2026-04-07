import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import KeyPointsBlock from '@/components/KeyPointsBlock'
import FreeWriteBlock from '@/components/FreeWriteBlock'
import RefinedTextBlock from '@/components/RefinedTextBlock'
import type { DailyRecord } from '@/types/record'

export default function RecordPage() {
  const router = useRouter()
  const { date } = router.query

  const [record, setRecord] = useState<DailyRecord | null>(null)
  const [keyPoints, setKeyPoints] = useState('')
  const [freeWrite, setFreeWrite] = useState('')
  const [refinedText, setRefinedText] = useState('')
  const [loading, setLoading] = useState(true)
  const [refining, setRefining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today
  const readOnly = !isToday

  useEffect(() => {
    if (!date || typeof date !== 'string') return

    async function fetchRecord() {
      try {
        const response = await fetch(`/api/records/${date}`)
        if (!response.ok) {
          throw new Error('Failed to fetch record')
        }
        const data = await response.json()

        if (data.record) {
          setRecord(data.record)
          setKeyPoints(data.record.keyPoints)
          setFreeWrite(data.record.freeWrite)
          setRefinedText(data.record.refinedText || '')
        }
      } catch (err) {
        console.error('Error fetching record:', err)
        setError('Failed to load record')
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [date])

  useEffect(() => {
    if (!isToday || !date || typeof date !== 'string') return

    const timeoutId = setTimeout(async () => {
      try {
        await fetch(`/api/records/${date}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyPoints, freeWrite, refinedText: refinedText || undefined }),
        })
      } catch (err) {
        console.error('Auto-save failed:', err)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [keyPoints, freeWrite, refinedText, isToday, date])

  const handleRefine = async () => {
    if (!freeWrite.trim()) {
      alert('Please write something in Free Write before refining')
      return
    }

    setRefining(true)
    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: freeWrite }),
      })

      if (!response.ok) {
        throw new Error('Refinement failed')
      }

      const data = await response.json()
      setRefinedText(data.refinedText)
    } catch (err) {
      console.error('Error refining text:', err)
      alert('Failed to refine text. Please try again.')
    } finally {
      setRefining(false)
    }
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
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Calendar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {date}
          </h1>

          <KeyPointsBlock
            value={keyPoints}
            onChange={setKeyPoints}
            readOnly={readOnly}
          />

          <FreeWriteBlock
            value={freeWrite}
            onChange={setFreeWrite}
            readOnly={readOnly}
          />

          <RefinedTextBlock
            value={refinedText}
            onChange={setRefinedText}
            onRefine={handleRefine}
            readOnly={readOnly}
            loading={refining}
          />
        </div>
      </div>
    </div>
  )
}
