import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import KeyPointsBlock from '@/components/KeyPointsBlock'
import FreeWriteBlock from '@/components/FreeWriteBlock'
import RefinedTextBlock from '@/components/RefinedTextBlock'
import type { DailyRecord } from '@/types/record'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return { head: value, year: '' }

  const [, year, month, day] = match
  return {
    head: `${MONTHS[Number(month) - 1]} ${Number(day)}`,
    year,
  }
}

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

  const heading = formatDate(typeof date === 'string' ? date : '')

  return (
    <>
      <Head>
        <title>{`Fluentiary — ${typeof date === 'string' ? date : 'Entry'}`}</title>
      </Head>

      <div className="fl-page">
        <div className="fl-wordmark">Fluentiary</div>

        {loading ? (
          <div className="fl-note">Loading…</div>
        ) : error ? (
          <div className="fl-note fl-note--error">{error}</div>
        ) : (
          <main style={{ width: '100%', maxWidth: 760 }}>
            <button type="button" className="fl-back" onClick={() => router.push('/')}>
              &larr; Back to Calendar
            </button>

            <div className="fl-card">
              <div className="fl-record-head">
                <h1 className="fl-record-date">
                  {heading.head} <span className="fl-record-date__dim">{heading.year}</span>
                </h1>
                <span className={`fl-chip ${isToday ? 'fl-chip--edit' : ''}`}>
                  <span className="fl-chip__key" />
                  {isToday ? 'Today · editable' : 'Past entry · view only'}
                </span>
              </div>

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

              {isToday && (
                <div className="fl-foot">
                  <span className="fl-legend__item">
                    Changes are saved automatically.
                  </span>
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </>
  )
}
