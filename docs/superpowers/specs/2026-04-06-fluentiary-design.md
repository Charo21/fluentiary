# Fluentiary Design Specification

**Date:** 2026-04-06
**Project:** Fluentiary - English Writing Practice Web Application

## Overview

Fluentiary is a full-stack web application for daily English writing practice. Users log daily English records with structured blocks, and an LLM refines their text to sound more natural and native. The app features a calendar view for navigation and a simple LLM refinement system.

## Requirements Summary

### Core Features
- **No user authentication**: Single-user application, direct access
- **Calendar view**: Monthly calendar with visual indicators for recorded days
- **Daily records**: Three-block structure (Key Points, Free Write, Refined Text)
- **LLM refinement**: Optimize Free Write text to sound more natural and native
- **Auto-save**: Real-time draft saving for today's record
- **Read-only history**: Past records are immutable

### User Experience
- Today's record: All blocks editable, can refine text
- Past records: All blocks read-only
- Calendar navigation: Click dates with records to view details
- Only today's date is clickable if no record exists

## Technical Stack

- **Frontend Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Calendar Component**: react-day-picker
- **LLM**: Google Gemini API (gemini-2.5-flash)
- **Deployment**: Local development environment

## Architecture

### Project Structure

```
fluentiary/
├── src/
│   ├── pages/
│   │   ├── index.tsx           # Calendar view page
│   │   ├── record/[date].tsx   # Daily record detail page
│   │   └── api/
│   │       ├── records/
│   │       │   ├── [date].ts   # GET/PUT single record
│   │       │   └── list.ts     # GET all record dates
│   │       └── refine.ts       # POST LLM refinement
│   ├── components/
│   │   ├── Calendar.tsx        # Calendar component
│   │   ├── RecordBlocks.tsx    # Container for three blocks
│   │   ├── KeyPointsBlock.tsx
│   │   ├── FreeWriteBlock.tsx
│   │   └── RefinedTextBlock.tsx
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client
│   │   └── gemini.ts           # Gemini API wrapper
│   └── types/
│       └── record.ts           # Type definitions
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
└── package.json
```

## Database Design

### Prisma Schema

```prisma
model Record {
  id          String   @id @default(cuid())
  date        DateTime @unique @db.Date  // Date (YYYY-MM-DD)
  keyPoints   String   @default("")      // Key points content
  freeWrite   String   @default("")      // Free write content
  refinedText String?                    // Refined text (nullable)
  isComplete  Boolean  @default(false)   // Has refined text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([date])
}
```

### Field Descriptions

- `date`: Unique index, one record per day
- `keyPoints` / `freeWrite`: Default empty strings, support draft saving
- `refinedText`: Nullable, only populated after successful LLM refinement
- `isComplete`: Marks whether record has refined text
- `createdAt` / `updatedAt`: Automatic timestamps

## API Design

### `GET /api/records/list`

Returns list of all dates with records (for calendar green dots).

**Response:**
```typescript
{
  dates: string[]  // ISO date strings (YYYY-MM-DD)
}
```

### `GET /api/records/[date]`

Fetch record for specific date.

**Parameters:**
- `date`: YYYY-MM-DD format

**Response:**
```typescript
{
  record: Record | null
}
```

### `PUT /api/records/[date]`

Save/update record for specific date (auto-save drafts).

**Parameters:**
- `date`: YYYY-MM-DD format

**Body:**
```typescript
{
  keyPoints?: string
  freeWrite?: string
  refinedText?: string
}
```

**Response:**
```typescript
{
  record: Record
}
```

### `POST /api/refine`

LLM refinement of free write text.

**Body:**
```typescript
{
  text: string
}
```

**Response:**
```typescript
{
  refinedText: string
}
```

**Error Handling:**
- Auto-retry up to 3 times with 1-second delay
- Return 500 error after 3 failures
- Return 429 for rate limiting

## Frontend Design

### Calendar View Page (`/`)

**Features:**
- Display monthly calendar view
- Show green dot indicator for dates with records
- Click date to navigate to `/record/[date]`
- Support month navigation (previous/next)

**Implementation:**
- Use `react-day-picker` for calendar rendering
- Call `GET /api/records/list` on page load
- Custom date styling with Tailwind (green dots)

**Interaction Rules:**
- Dates with records: Show green dot, clickable
- Today without record: Clickable, creates new record
- Past dates without record: Not clickable (disabled/grayed)

**Empty State:**
- No records exist: Show "Click today's date to start writing"

### Record Detail Page (`/record/[date]`)

**Features:**
- Display three blocks: Key Points, Free Write, Refined Text
- **Today's record**: All blocks editable, show "Refine" button
- **Past records**: All blocks read-only (gray background, disabled input)
- Auto-save: Debounced save (1 second delay) for Key Points and Free Write
- Refine button: Show loading state, update Refined Text on success

**State Management:**
- React state for three block contents
- `useEffect` + debounce for auto-save
- Loading state for Refine button

**Navigation:**
- "Back to Calendar" button returns to calendar view

**Empty State (Today):**
- New record: All blocks empty, waiting for user input

## LLM Refinement Logic

### Gemini API Wrapper (`lib/gemini.ts`)

**Prompt:**
```
You are an expert English writing coach. Your task is to refine the user's English text to sound more natural and native.

Rules:
- Preserve the original meaning and voice
- Correct grammar, vocabulary, and phrasing
- Improve logical flow and coherence
- Make it sound like a native English speaker wrote it
- Do NOT add new ideas or change the topic
- Return ONLY the refined text, no explanations or commentary

Text to refine:
${text}
```

**Configuration:**
- Use environment variables: `GEMINI_API_KEY`, `LLM_MODEL`, `LLM_MAX_TOKENS`

### Retry Mechanism (`/api/refine`)

- Maximum 3 retry attempts
- 1-second delay between retries
- Return error message to frontend after 3 failures
- Frontend displays error toast, user can manually retry

### Error Handling

- API rate limiting: Return 429 error
- Network errors: Return 500 error
- Frontend displays user-friendly error message (e.g., "Refinement failed, please retry")

## User Experience Details

### Auto-Save

- Key Points and Free Write trigger auto-save with 1-second debounce
- Call `PUT /api/records/[date]` silently
- Success: No notification (silent save)
- Failure: Display lightweight toast notification

### Refine Button Interaction

- Click: Button enters loading state (spinner + "Refining...")
- Success: Update Refined Text block, button returns to normal
- Failure: Display error message, button returns to normal, user can retry
- Refined Text is editable, can click Refine again after editing

### Date Detection

- Use local timezone to determine "today"
- Today: All blocks editable + show Refine button
- Not today: All blocks read-only (gray background + disabled input)

### Data Persistence Rules

- Key Points and Free Write: Always saved to database (draft state)
- Refined Text: Only saved after successful LLM refinement
- If no valid refined text exists for today, record remains in draft state (`isComplete = false`)
- Today's content persists across page navigation (database-backed, not localStorage)

## Implementation Notes

### Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "@prisma/client": "^5.x",
    "prisma": "^5.x",
    "react-day-picker": "^8.x",
    "@google/generative-ai": "^0.x"
  }
}
```

### Environment Variables

```
DATABASE_URL="postgresql://charo:changhao@localhost:5432/fluentiaryDB"
GEMINI_API_KEY="xxxxxxxxxxxxxx"
LLM_MODEL="gemini-2.5-flash"
LLM_MAX_TOKENS="1024"
```

### Development Workflow

1. Initialize Next.js project with TypeScript
2. Set up Prisma with PostgreSQL
3. Create database schema and run migrations
4. Implement API routes
5. Build calendar view page
6. Build record detail page
7. Integrate Gemini API
8. Add styling with Tailwind CSS
9. Test all features locally

## Success Criteria

- User can view monthly calendar with record indicators
- User can create and edit today's record
- User can view past records (read-only)
- LLM refinement produces natural, native-sounding English
- Auto-save works reliably without data loss
- Error handling provides clear feedback
- Application runs smoothly in local development environment

## Out of Scope

- User authentication/authorization
- Multi-user support
- Cloud deployment
- Mobile app
- Export/import functionality
- Search functionality
- Tags or categories
- Statistics or analytics
