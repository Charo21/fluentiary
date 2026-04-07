# Fluentiary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack English writing practice app with calendar navigation, daily records, and LLM text refinement.

**Architecture:** Next.js Pages Router with TypeScript, Prisma ORM for PostgreSQL, API routes for backend logic, react-day-picker for calendar UI, Gemini API for text refinement.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL, react-day-picker, Google Gemini API

---

## File Structure Overview

**New Files to Create:**
- `package.json` - Project dependencies
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `prisma/schema.prisma` - Database schema
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/gemini.ts` - Gemini API wrapper
- `src/types/record.ts` - TypeScript type definitions
- `src/pages/_app.tsx` - Next.js app wrapper
- `src/pages/index.tsx` - Calendar view page
- `src/pages/record/[date].tsx` - Record detail page
- `src/pages/api/records/list.ts` - API: Get all record dates
- `src/pages/api/records/[date].ts` - API: Get/update single record
- `src/pages/api/refine.ts` - API: LLM text refinement
- `src/components/Calendar.tsx` - Calendar component
- `src/components/KeyPointsBlock.tsx` - Key points input block
- `src/components/FreeWriteBlock.tsx` - Free write input block
- `src/components/RefinedTextBlock.tsx` - Refined text display/edit block

---

### Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `src/pages/_app.tsx`
- Create: `src/styles/globals.css`

- [ ] **Step 1: Initialize Next.js project with TypeScript**

```bash
npx create-next-app@14 . --typescript --tailwind --app=false --src-dir --import-alias="@/*"
```

Expected: Project scaffolding created with Pages Router

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @prisma/client prisma react-day-picker date-fns @google/generative-ai
npm install -D @types/node
```

Expected: Dependencies installed successfully

- [ ] **Step 3: Verify tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Update src/styles/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
```

- [ ] **Step 5: Create src/pages/_app.tsx**

```typescript
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Database Setup

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

Expected: `prisma/schema.prisma` and `.env` created

- [ ] **Step 2: Create prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Record {
  id          String   @id @default(cuid())
  date        DateTime @unique @db.Date
  keyPoints   String   @default("")
  freeWrite   String   @default("")
  refinedText String?
  isComplete  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([date])
}
```

- [ ] **Step 3: Verify .env has DATABASE_URL**

Expected: `.env` contains `DATABASE_URL="postgresql://charo:changhao@localhost:5432/fluentiaryDB"`

- [ ] **Step 4: Run Prisma migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration created and applied, database table created

- [ ] **Step 5: Generate Prisma Client**

```bash
npx prisma generate
```

Expected: Prisma Client generated successfully

- [ ] **Step 6: Create src/lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts .env
git commit -m "feat: set up Prisma with PostgreSQL schema"
```

---

### Task 3: Type Definitions

**Files:**
- Create: `src/types/record.ts`

- [ ] **Step 1: Create src/types/record.ts**

```typescript
export interface Record {
  id: string
  date: string // ISO date string (YYYY-MM-DD)
  keyPoints: string
  freeWrite: string
  refinedText: string | null
  isComplete: boolean
  createdAt: string
  updatedAt: string
}

export interface RecordUpdateInput {
  keyPoints?: string
  freeWrite?: string
  refinedText?: string
}

export interface RefineRequest {
  text: string
}

export interface RefineResponse {
  refinedText: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/record.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 4: Gemini API Integration

**Files:**
- Create: `src/lib/gemini.ts`

- [ ] **Step 1: Create src/lib/gemini.ts**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function refineText(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: process.env.LLM_MODEL || 'gemini-2.5-flash'
  })

  const prompt = `You are an expert English writing coach. Your task is to refine the user's English text to sound more natural and native.

Rules:
- Preserve the original meaning and voice
- Correct grammar, vocabulary, and phrasing
- Improve logical flow and coherence
- Make it sound like a native English speaker wrote it
- Do NOT add new ideas or change the topic
- Return ONLY the refined text, no explanations or commentary

Text to refine:
${text}`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}
```

- [ ] **Step 2: Verify .env has GEMINI_API_KEY**

Expected: `.env` contains `GEMINI_API_KEY` and `LLM_MODEL`

- [ ] **Step 3: Commit**

```bash
git add src/lib/gemini.ts
git commit -m "feat: add Gemini API integration for text refinement"
```

---

### Task 5: API Route - Get Record Dates List

**Files:**
- Create: `src/pages/api/records/list.ts`

- [ ] **Step 1: Create src/pages/api/records/list.ts**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const records = await prisma.record.findMany({
      select: { date: true },
      orderBy: { date: 'desc' }
    })

    const dates = records.map(r => r.date.toISOString().split('T')[0])

    return res.status(200).json({ dates })
  } catch (error) {
    console.error('Error fetching record dates:', error)
    return res.status(500).json({ error: 'Failed to fetch record dates' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/records/list.ts
git commit -m "feat: add API route to get all record dates"
```

---

### Task 6: API Route - Get/Update Single Record

**Files:**
- Create: `src/pages/api/records/[date].ts`

- [ ] **Step 1: Create src/pages/api/records/[date].ts**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { date } = req.query

  if (typeof date !== 'string') {
    return res.status(400).json({ error: 'Invalid date parameter' })
  }

  if (req.method === 'GET') {
    try {
      const record = await prisma.record.findUnique({
        where: { date: new Date(date) }
      })

      if (!record) {
        return res.status(200).json({ record: null })
      }

      const formattedRecord = {
        ...record,
        date: record.date.toISOString().split('T')[0],
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString()
      }

      return res.status(200).json({ record: formattedRecord })
    } catch (error) {
      console.error('Error fetching record:', error)
      return res.status(500).json({ error: 'Failed to fetch record' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { keyPoints, freeWrite, refinedText } = req.body

      const updateData: any = {}
      if (keyPoints !== undefined) updateData.keyPoints = keyPoints
      if (freeWrite !== undefined) updateData.freeWrite = freeWrite
      if (refinedText !== undefined) {
        updateData.refinedText = refinedText
        updateData.isComplete = refinedText !== null && refinedText !== ''
      }

      const record = await prisma.record.upsert({
        where: { date: new Date(date) },
        update: updateData,
        create: {
          date: new Date(date),
          ...updateData
        }
      })

      const formattedRecord = {
        ...record,
        date: record.date.toISOString().split('T')[0],
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString()
      }

      return res.status(200).json({ record: formattedRecord })
    } catch (error) {
      console.error('Error updating record:', error)
      return res.status(500).json({ error: 'Failed to update record' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/records/[date].ts
git commit -m "feat: add API route to get/update single record"
```

---

### Task 7: API Route - LLM Refinement with Retry

**Files:**
- Create: `src/pages/api/refine.ts`

- [ ] **Step 1: Create src/pages/api/refine.ts**

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { refineText } from '@/lib/gemini'

async function refineWithRetry(text: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await refineText(text)
    } catch (error) {
      console.error(`Refinement attempt ${attempt} failed:`, error)

      if (attempt === maxRetries) {
        throw error
      }

      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  throw new Error('All retry attempts failed')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid text parameter' })
  }

  try {
    const refinedText = await refineWithRetry(text)
    return res.status(200).json({ refinedText })
  } catch (error: any) {
    console.error('Refinement failed after retries:', error)

    if (error.message?.includes('429') || error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded, please try again later' })
    }

    return res.status(500).json({ error: 'Failed to refine text, please try again' })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/refine.ts
git commit -m "feat: add API route for LLM text refinement with retry logic"
```

---

### Task 8: Calendar Component

**Files:**
- Create: `src/components/Calendar.tsx`

- [ ] **Step 1: Create src/components/Calendar.tsx**

```typescript
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { useRouter } from 'next/router'
import { format, isToday, parseISO } from 'date-fns'

interface CalendarProps {
  recordDates: string[] // ISO date strings (YYYY-MM-DD)
}

export default function Calendar({ recordDates }: CalendarProps) {
  const router = useRouter()

  const recordDateObjects = recordDates.map(d => parseISO(d))

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const hasRecord = recordDates.includes(dateStr)
    const isTodayDate = isToday(date)

    // Only allow click if: has record OR is today
    if (hasRecord || isTodayDate) {
      router.push(`/record/${dateStr}`)
    }
  }

  const modifiers = {
    hasRecord: recordDateObjects,
    clickable: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return recordDates.includes(dateStr) || isToday(date)
    }
  }

  const modifiersClassNames = {
    hasRecord: 'has-record',
    clickable: 'clickable-date'
  }

  return (
    <div className="calendar-container">
      <style jsx global>{`
        .has-record {
          position: relative;
        }
        .has-record::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          background-color: #10b981;
          border-radius: 50%;
        }
        .clickable-date {
          cursor: pointer;
        }
        .clickable-date:hover {
          background-color: #f3f4f6;
        }
        .rdp-day:not(.clickable-date) {
          cursor: not-allowed;
          opacity: 0.5;
        }
      `}</style>
      <DayPicker
        mode="single"
        onDayClick={handleDayClick}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
      />
    </div>
  )
}
```

- [ ] **Step 2: Install date-fns if not already installed**

```bash
npm list date-fns || npm install date-fns
```

Expected: date-fns is available

- [ ] **Step 3: Commit**

```bash
git add src/components/Calendar.tsx
git commit -m "feat: add Calendar component with record indicators"
```

---

### Task 9: Calendar View Page

**Files:**
- Create: `src/pages/index.tsx`

- [ ] **Step 1: Create src/pages/index.tsx**

```typescript
import { useEffect, useState } from 'react'
import Calendar from '@/components/Calendar'

export default function Home() {
  const [recordDates, setRecordDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecordDates() {
      try {
        const res = await fetch('/api/records/list')
        const data = await res.json()
        setRecordDates(data.dates || [])
      } catch (error) {
        console.error('Failed to fetch record dates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecordDates()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Fluentiary</h1>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <>
            {recordDates.length === 0 && (
              <p className="text-center text-gray-500 mb-4">
                Click today's date to start writing
              </p>
            )}
            <div className="flex justify-center">
              <Calendar recordDates={recordDates} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: add calendar view page"
```

---

### Task 10: Key Points Block Component

**Files:**
- Create: `src/components/KeyPointsBlock.tsx`

- [ ] **Step 1: Create src/components/KeyPointsBlock.tsx**

```typescript
interface KeyPointsBlockProps {
  value: string
  onChange: (value: string) => void
  readOnly: boolean
}

export default function KeyPointsBlock({ value, onChange, readOnly }: KeyPointsBlockProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Key Points
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={readOnly ? '' : 'What are the main points you want to write about?'}
        className={`w-full h-32 p-3 border rounded-lg resize-none ${
          readOnly
            ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
            : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/KeyPointsBlock.tsx
git commit -m "feat: add KeyPointsBlock component"
```

---

### Task 11: Free Write Block Component

**Files:**
- Create: `src/components/FreeWriteBlock.tsx`

- [ ] **Step 1: Create src/components/FreeWriteBlock.tsx**

```typescript
interface FreeWriteBlockProps {
  value: string
  onChange: (value: string) => void
  readOnly: boolean
}

export default function FreeWriteBlock({ value, onChange, readOnly }: FreeWriteBlockProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Free Write
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={readOnly ? '' : 'Write freely in English...'}
        className={`w-full h-48 p-3 border rounded-lg resize-none ${
          readOnly
            ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
            : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FreeWriteBlock.tsx
git commit -m "feat: add FreeWriteBlock component"
```

---

### Task 12: Refined Text Block Component

**Files:**
- Create: `src/components/RefinedTextBlock.tsx`

- [ ] **Step 1: Create src/components/RefinedTextBlock.tsx**

```typescript
import { useState } from 'react'

interface RefinedTextBlockProps {
  value: string
  onChange: (value: string) => void
  onRefine: () => Promise<void>
  readOnly: boolean
  canRefine: boolean
}

export default function RefinedTextBlock({
  value,
  onChange,
  onRefine,
  readOnly,
  canRefine
}: RefinedTextBlockProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRefine = async () => {
    setLoading(true)
    setError(null)
    try {
      await onRefine()
    } catch (err: any) {
      setError(err.message || 'Failed to refine text')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Refined Text
        </label>
        {canRefine && !readOnly && (
          <button
            onClick={handleRefine}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Refining...' : 'Refine'}
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={readOnly ? '' : 'Refined text will appear here...'}
        className={`w-full h-48 p-3 border rounded-lg resize-none ${
          readOnly
            ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
            : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RefinedTextBlock.tsx
git commit -m "feat: add RefinedTextBlock component with refine button"
```

---

### Task 13: Record Detail Page

**Files:**
- Create: `src/pages/record/[date].tsx`

- [ ] **Step 1: Create src/pages/record/[date].tsx**

```typescript
import { useRouter } from 'next/router'
import { useEffect, useState, useCallback } from 'react'
import { isToday, parseISO } from 'date-fns'
import KeyPointsBlock from '@/components/KeyPointsBlock'
import FreeWriteBlock from '@/components/FreeWriteBlock'
import RefinedTextBlock from '@/components/RefinedTextBlock'
import type { Record } from '@/types/record'

export default function RecordPage() {
  const router = useRouter()
  const { date } = router.query

  const [record, setRecord] = useState<Record | null>(null)
  const [keyPoints, setKeyPoints] = useState('')
  const [freeWrite, setFreeWrite] = useState('')
  const [refinedText, setRefinedText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const dateStr = typeof date === 'string' ? date : ''
  const isTodayDate = dateStr ? isToday(parseISO(dateStr)) : false

  // Fetch record on mount
  useEffect(() => {
    if (!dateStr) return

    async function fetchRecord() {
      try {
        const res = await fetch(`/api/records/${dateStr}`)
        const data = await res.json()

        if (data.record) {
          setRecord(data.record)
          setKeyPoints(data.record.keyPoints)
          setFreeWrite(data.record.freeWrite)
          setRefinedText(data.record.refinedText || '')
        }
      } catch (error) {
        console.error('Failed to fetch record:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [dateStr])

  // Auto-save with debounce
  const saveRecord = useCallback(async (updates: any) => {
    if (!dateStr) return

    try {
      const res = await fetch(`/api/records/${dateStr}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await res.json()
      if (data.record) {
        setRecord(data.record)
      }
    } catch (error) {
      console.error('Failed to save record:', error)
    }
  }, [dateStr])

  // Debounced save for keyPoints
  useEffect(() => {
    if (!isTodayDate || loading) return

    if (saveTimeout) clearTimeout(saveTimeout)

    const timeout = setTimeout(() => {
      saveRecord({ keyPoints })
    }, 1000)

    setSaveTimeout(timeout)

    return () => clearTimeout(timeout)
  }, [keyPoints, isTodayDate, loading, saveRecord])

  // Debounced save for freeWrite
  useEffect(() => {
    if (!isTodayDate || loading) return

    if (saveTimeout) clearTimeout(saveTimeout)

    const timeout = setTimeout(() => {
      saveRecord({ freeWrite })
    }, 1000)

    setSaveTimeout(timeout)

    return () => clearTimeout(timeout)
  }, [freeWrite, isTodayDate, loading, saveRecord])

  // Debounced save for refinedText
  useEffect(() => {
    if (!isTodayDate || loading) return

    if (saveTimeout) clearTimeout(saveTimeout)

    const timeout = setTimeout(() => {
      saveRecord({ refinedText })
    }, 1000)

    setSaveTimeout(timeout)

    return () => clearTimeout(timeout)
  }, [refinedText, isTodayDate, loading, saveRecord])

  const handleRefine = async () => {
    if (!freeWrite.trim()) {
      throw new Error('Please write something in Free Write first')
    }

    const res = await fetch('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: freeWrite })
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to refine text')
    }

    const data = await res.json()
    setRefinedText(data.refinedText)

    // Save immediately
    await saveRecord({ refinedText: data.refinedText })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Calendar
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-2">{dateStr}</h1>
        <p className="text-gray-500 mb-8">
          {isTodayDate ? "Today's Record" : 'Past Record (Read Only)'}
        </p>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <KeyPointsBlock
            value={keyPoints}
            onChange={setKeyPoints}
            readOnly={!isTodayDate}
          />

          <FreeWriteBlock
            value={freeWrite}
            onChange={setFreeWrite}
            readOnly={!isTodayDate}
          />

          <RefinedTextBlock
            value={refinedText}
            onChange={setRefinedText}
            onRefine={handleRefine}
            readOnly={!isTodayDate}
            canRefine={isTodayDate && freeWrite.trim().length > 0}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/record/
git commit -m "feat: add record detail page with auto-save and refine"
```

---

### Task 14: Final Testing and Verification

**Files:**
- None (testing only)

- [ ] **Step 1: Start development server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000

- [ ] **Step 2: Test calendar view**

Open http://localhost:3000
Expected: Calendar displays, empty state message shows if no records

- [ ] **Step 3: Test creating today's record**

Click today's date
Expected: Navigate to /record/YYYY-MM-DD, all blocks editable

- [ ] **Step 4: Test auto-save**

Type in Key Points and Free Write
Wait 2 seconds
Refresh page
Expected: Content persists

- [ ] **Step 5: Test LLM refinement**

Write text in Free Write
Click "Refine" button
Expected: Loading state shows, refined text appears

- [ ] **Step 6: Test read-only past records**

Create a record with past date in database manually:
```bash
npx prisma studio
```
Add record with past date
Navigate to that date
Expected: All blocks read-only, no Refine button

- [ ] **Step 7: Test calendar green dots**

Return to calendar
Expected: Dates with records show green dots

- [ ] **Step 8: Test non-clickable past dates**

Try clicking past date without record
Expected: No navigation, cursor shows not-allowed

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "test: verify all features working correctly"
```

---

## Spec Coverage Review

✅ **No user authentication** - Implemented (no auth system)
✅ **Calendar view** - Task 8, 9
✅ **Monthly calendar with indicators** - Task 8
✅ **Three-block structure** - Tasks 10, 11, 12
✅ **LLM refinement** - Tasks 4, 7, 12
✅ **Auto-save** - Task 13
✅ **Read-only history** - Task 13
✅ **Today editable, past read-only** - Task 13
✅ **Click dates with records** - Task 8
✅ **Only today clickable if no record** - Task 8
✅ **Database with Prisma** - Task 2
✅ **API routes** - Tasks 5, 6, 7
✅ **Retry logic** - Task 7
✅ **Error handling** - Tasks 7, 12
✅ **Tailwind styling** - All component tasks

All spec requirements covered.

