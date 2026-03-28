# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

---

## Project Overview

**fluentiary** is a full-stack web application for English writing practice. Users log daily English records, and an LLM refines their text iteratively. The app features a calendar view, structured daily records, and a LLM refinement chained system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| ORM | Prisma |
| Database | PostgreSQL |
| State | Zustand + TanStack Query |
| LLM | Gemini API |
| Validation | Zod |
| Testing | Vitest + Testing Library |
| Deployment | Vercel + Supabase |

---

## Commands

```bash
# Development
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm start             # Start production server

# Database
npm run db:migrate    # Run prisma migrate dev
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed with sample data
npm run db:reset      # Drop + re-migrate + seed

# Code Quality
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run typecheck     # tsc --noEmit
npm run format        # Prettier

# Testing
npm test              # Vitest (watch mode)
npm run test:run      # Vitest (CI mode, single run)
npm run test:coverage # Coverage report
```

Always run `npm run typecheck && npm run lint` before committing.

---

## Repository Structure

```
english-boost/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, theme, providers)
│   ├── page.tsx                # Redirect → /calendar
│   ├── calendar/page.tsx       # Monthly calendar view
│   ├── day/[date]/page.tsx     # Day detail page (read-only)
│   ├── new/page.tsx            # Create today's record
│   └── api/
│       ├── records/route.ts          # GET, POST
│       ├── records/[id]/route.ts     # PATCH, DELETE
│       ├── blocks/route.ts           # POST
│       ├── blocks/[id]/route.ts      # PATCH, DELETE
│       ├── refine/route.ts           # POST — LLM streaming (Edge)
│       └── calendar/route.ts         # GET ?month=YYYY-MM
│
├── components/
│   ├── calendar/               # CalendarView, CalendarCell, CalendarHeader
│   ├── record/                 # DayRecordSheet, NewRecordForm, editors
│   ├── refine/                 # RefineBlock, RefineActions, RefineStream
│   └── ui/                     # SaveIndicator, EmptyState, DeleteConfirm, etc.
│
├── hooks/
│   ├── useRecord.ts            # CRUD + optimistic updates
│   ├── useRefine.ts            # LLM call + stream handling
│   ├── useCalendar.ts          # Month data + status map
│   ├── useAutoSave.ts          # 800ms debounced PATCH
│   └── useBlockChain.ts        # Refine chain ordering
│
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── llm/
│   │   ├── client.ts           # Anthropic SDK init
│   │   ├── refineService.ts    # buildPrompt + streaming call
│   │   ├── prompts.ts          # System prompt templates
│   │   └── retry.ts            # Exponential backoff (max 3 retries)
│   ├── validations/            # Zod schemas
│   └── utils/                  # date-fns helpers, SSE stream utils
│
├── store/
│   ├── recordStore.ts          # Zustand: current day editing state
│   └── calendarStore.ts        # Zustand: month view cache
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── types/
    ├── record.ts               # DayRecord, ContentBlock, BulletPoint
    └── refine.ts               # RefineVersion, RefineChain
```

---

## Data Models

### Core Schema (Prisma)

```prisma
model DayRecord {
  id           String         @id @default(uuid())
  date         DateTime       @db.Date
  userId       String?
  createdAt    DateTime       @default(now())
  bulletPoints  String?       @db.Text
  blocks       ContentBlock[]

  @@unique([userId, date])
}

model ContentBlock {
  id          String          @id @default(uuid())
  dayRecordId String
  dayRecord   DayRecord       @relation(fields: [dayRecordId], references: [id], onDelete: Cascade)
  rawText     String          @db.Text
  sortOrder   Int             @default(0)
  createdAt   DateTime        @default(now())
  versions    RefineVersion[]
}

model RefineVersion {
  id              String          @id @default(uuid())
  blockId         String
  block           ContentBlock    @relation(fields: [blockId], references: [id], onDelete: Cascade)
  parentVersionId String?
  parent          RefineVersion?  @relation("chain", fields: [parentVersionId], references: [id])
  children        RefineVersion[] @relation("chain")
  content         String          @db.Text
  isEdited        Boolean         @default(false)
  versionNum      Int             @default(1)
  llmModel        String?
  promptTokens    Int?
  createdAt       DateTime        @default(now())
}
```

### Key Relationships

- `DayRecord` 1 → N `ContentBlock` — the raw Record text blocks
- `ContentBlock` 1 → N `RefineVersion` — each LLM refinement pass
- `RefineVersion` self-referential via `parentVersionId` — chains further refinements

---

## API Routes

### Records

```
GET    /api/calendar?month=YYYY-MM     Returns {date, hasRecord}[] for the month
GET    /api/records?date=YYYY-MM-DD   Fetch full day record with blocks + versions
POST   /api/records                   Create day record {date}
PATCH  /api/records/:id               Update record metadata
DELETE /api/records/:id               Delete record (cascades all blocks)
```

### Blocks & Bullets

```
POST   /api/blocks                    Create ContentBlock {dayRecordId, rawText, sortOrder}
PATCH  /api/blocks/:id                Update rawText or sortOrder
DELETE /api/blocks/:id                Delete block + all its refine versions
```

### LLM Refinement (Edge Runtime)

```
POST   /api/refine
Body:  { blockId: string, content: string, parentVersionId?: string }
Returns: SSE stream → RefineVersion saved after stream completes
```

---

## LLM Integration

### Model

Always use `Gemini API`.

### Refine System Prompt

```
You are an expert English writing coach.
Your task is to refine the user's English text to sound more natural and native.

Rules:
- Preserve the original meaning and voice
- Correct grammar, vocabulary, and phrasing
- Improve logical flow and coherence
- Make it sound like a native English speaker wrote it
- Do NOT add new ideas or change the topic
- Return ONLY the refined text, no explanations or commentary
```

### Streaming Pattern

```typescript
// app/api/refine/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { content, blockId, parentVersionId } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: process.env.LLM_MODEL ?? 'gemini-2.5-flash',
    systemInstruction: REFINE_SYSTEM_PROMPT,
  });

  const result = await model.generateContentStream(content);

  // Stream to client, persist version on finalMessage
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### Retry Logic (`lib/llm/retry.ts`)

- Max 3 attempts
- Exponential backoff: 1s → 2s → 4s
- Retry on: `529 Overloaded`, `500 Internal`, network errors
- Do NOT retry on: `400 Bad Request`, `401 Unauthorized`

---

## State Management

### Zustand Stores

**`recordStore`** — manages the in-progress edit session for the current day:
```typescript
interface RecordStore {
  date: string | null;
  bullets: BulletPoint[];
  rawText: string;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  // actions: setBullets, setRawText, setSaveStatus
}
```

**`calendarStore`** — caches month-level has-record status:
```typescript
interface CalendarStore {
  markedDates: Map<string, boolean>; // 'YYYY-MM-DD' → hasRecord
  currentMonth: string;              // 'YYYY-MM'
  // actions: setMonth, markDate, clearCache
}
```

### TanStack Query

Used for all server data fetching and mutations. Key query keys:
```typescript
['calendar', month]        // month status map
['record', date]           // single day full record
['blocks', recordId]       // blocks for a record
['versions', blockId]      // refine chain for a block
```

Optimistic updates are applied on PATCH/DELETE. On error, queries are refetched.

---

## Component Patterns

### RefineChain

The `RefineChain` component renders a vertical list of `RefineBlock` items, one per `RefineVersion`. Each block:

1. Shows the refined content (editable if `isEdited` or user clicks Edit)
2. Has a **Refine** button — calls `/api/refine` with current content
3. Has an **Add** button — calls `/api/refine` with `parentVersionId` set to current version
4. Tracks streaming state: `idle | streaming | done | error`

```typescript
// Never nest RefineBlock inside itself — always render as a flat list
// The chain hierarchy is stored in DB, not in the component tree
```

### SaveIndicator

Display `saving...` after any mutation fires, `saved` after 1.5s, back to `idle`. Use the `useAutoSave` hook for rawText changes — it debounces at 800ms.

### EmptyState

Show when a day has no record yet. Include a CTA button to `/new?date=YYYY-MM-DD`.

---

## Environment Variables

```bash
# Required
DATABASE_URL="postgresql://..."
GEMINI_API_KEY="..."

# Optional
LLM_MODEL="gemini-2.0-flash-exp"       # Override LLM model
LLM_MAX_TOKENS="1024"                  # Max tokens per refine call
NEXT_PUBLIC_APP_URL="https://..."      # For absolute URLs in emails (future)
```

Never commit `.env.local`. The `.env.example` file documents all variables.

---

## Coding Conventions

### TypeScript

- Strict mode is on — no `any`, no `!` non-null assertions
- Use `type` for data shapes, `interface` only for component props
- Export types from `types/` directory, not inline in components

### API Route Handlers

```typescript
// Always validate input with Zod
const body = RequestSchema.safeParse(await req.json());
if (!body.success) {
  return Response.json({ error: body.error.flatten() }, { status: 400 });
}

// Always wrap DB calls in try/catch
try {
  const result = await prisma.dayRecord.create({ ... });
  return Response.json(result, { status: 201 });
} catch (error) {
  console.error('[records/POST]', error);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
```

### Components

- One component per file
- Co-locate component-specific hooks in the same directory
- Use `'use client'` only when necessary (event handlers, hooks, browser APIs)
- Server Components by default for all page-level components

### Tailwind

- No custom CSS unless absolutely necessary
- Use `cn()` (clsx + tailwind-merge) for conditional classes
- Dark mode via `dark:` prefix — the app supports system preference

---

## Testing Strategy

### Unit Tests (`tests/unit/`)

Focus on pure functions:
- `lib/llm/refineService.ts` — prompt building
- `lib/llm/retry.ts` — retry logic
- `lib/utils/dates.ts` — date formatting helpers
- Zod validation schemas

### Integration Tests (`tests/integration/`)

Test API routes with a real test database:
- `GET /api/calendar` — returns correct marked dates
- `POST /api/records` — creates record and returns it
- `PATCH /api/blocks/:id` — updates and triggers auto-save
- `POST /api/refine` — mock Anthropic SDK, verify SSE stream

```typescript
// Use a separate TEST_DATABASE_URL, never the dev DB
// Reset with prisma migrate reset --force before each suite
```

---

## Key Business Rules

1. **One record per day per user** — enforced by `@@unique([userId, date])`. Return 409 if duplicate.
2. **Calendar ✅ marker** — a day is "marked" if and only if a `DayRecord` row exists for that date, regardless of content.
3. **Refine chain ordering** — versions are ordered by `createdAt ASC`. The latest version is the "current" one shown at the bottom of the chain.
4. **`isEdited` flag** — set to `true` when the user manually edits a `RefineVersion`. The next "Add" refine pass uses the edited content as its base.
5. **Delete confirmation** — always show a confirmation dialog before deleting a `DayRecord` or `ContentBlock`. Deletion cascades in the DB.
6. **No empty blocks** — do not allow saving a `ContentBlock` with empty `rawText`.

---

## Common Pitfalls

- **Prisma in Edge Runtime**: `lib/db.ts` uses the standard Prisma client, which is Node.js only. API routes that use Prisma must NOT use `export const runtime = 'edge'`. Only `/api/refine` (which uses the Anthropic SDK with streaming) is an Edge route.
- **Date handling**: Always store and compare dates as `YYYY-MM-DD` strings on the client. Prisma returns `Date` objects — use `format(date, 'yyyy-MM-dd')` from date-fns before passing to the frontend.
- **Streaming cleanup**: If the user navigates away mid-stream, call `stream.controller.abort()` to cancel the fetch. The `useRefine` hook handles this in its cleanup function.
- **Optimistic updates**: Always roll back on error and invalidate the relevant query key. Do not show stale data after a failed mutation.

---

## Future Roadmap (do not implement yet)

- **Auth**: NextAuth.js with Google OAuth — `userId` is already in the schema
- **Tags**: `tags string[]` field on `DayRecord` — schema-ready
- **Full-text search**: `search_vector tsvector` on `ContentBlock.rawText` via PostgreSQL
- **Export**: Markdown / PDF export of a date range
- **Streaks**: Compute consecutive day streaks from `DayRecord` dates
- **Mobile app**: React Native sharing the same API layer