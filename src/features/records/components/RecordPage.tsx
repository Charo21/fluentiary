import JournalHeader from '@/features/auth/components/JournalHeader'
import { useDailyRecord } from '../hooks/useDailyRecord'
import Head from 'next/head'
import { useRouter } from 'next/router'
import KeyPointsBlock from '@/features/records/components/KeyPointsBlock'
import FreeWriteBlock from '@/features/records/components/FreeWriteBlock'
import RefinedTextBlock from '@/features/records/components/RefinedTextBlock'

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

  const {
    keyPoints, setKeyPoints,
    freeWrite, setFreeWrite,
    refinedText, setRefinedText,
    loading, refining, error,
    isToday, readOnly, handleRefine,
  } = useDailyRecord(date)

  const heading = formatDate(typeof date === 'string' ? date : '')

  return (
    <>
      <Head>
        <title>{`Fluentiary — ${typeof date === 'string' ? date : 'Entry'}`}</title>
      </Head>

      <div className="fl-page">
        <JournalHeader />

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
