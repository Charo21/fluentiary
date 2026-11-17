# Fluentiary

English writing journal built with Next.js Pages Router, React, TypeScript, Prisma/PostgreSQL, Gemini, and Google authentication through NextAuth.

## Setup

```bash
npm install
cp .env.example .env
```

If `.env` already exists, add the missing entries rather than replacing it. Configure `DATABASE_URL`, `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL` and `NEXTAUTH_SECRET`. The aliases `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_SECRET` are also supported; the corresponding `GOOGLE_CLIENT_*` and `NEXTAUTH_SECRET` values take precedence when present. Set `NEXTAUTH_URL` explicitly for NextAuth 4.

Generate the session secret with `openssl rand -base64 32`; keep it private and stable across deployments.

In Google Cloud Console, configure an OAuth consent screen and an OAuth client with application type **Web application**. Add the development redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

For deployment, add `https://YOUR_DOMAIN/api/auth/callback/google` and set `NEXTAUTH_URL=https://YOUR_DOMAIN`. If the consent screen is in testing mode, add the Google accounts that will test the app as test users. Do not put client secrets or the session secret in `NEXT_PUBLIC_*` variables.

Apply database migrations separately from the build:

```bash
npm run db:migrate
npm run dev
```

**The Google authentication migration deletes existing ownerless journal entries, as approved for this project.** It creates `User` and `Account`, associates every new record with a user, and replaces the global date constraint with `(userId, date)` uniqueness. Apply it to the intended database. It does not create `Session` or `VerificationToken` tables.

Open [http://localhost:3000](http://localhost:3000). Anonymous visitors are sent to `/login`. Google sign-in automatically registers a user on first login; returning users keep the same internal user ID. The app does not store avatars, passwords or email verification fields, and does not send verification emails.

## Source structure

```text
src/
├── pages/                         # Next.js route entries and server page guards
│   ├── _app.tsx                   # SessionProvider + CommonStatusProvider
│   ├── login.tsx
│   ├── index.tsx
│   ├── record/[date].tsx
│   └── api/                       # Auth, journal, refinement and cron routes
├── common/status/                 # Shared local clock and current account hooks
├── features/
│   ├── auth/                      # Login/account UI, JWT options, adapter and guards
│   ├── calendar/                  # Calendar components and record-date loading
│   ├── records/                   # Editor, lifecycle hooks, per-user API handlers/types
│   └── refinement/                # Refinement handler, retries and contracts
├── lib/                           # Prisma client and Gemini SDK integration
└── styles/                        # Global styles
```

Keep related code/tests in each feature. Server implementations belong under `server/`; client code must not import authentication options, Prisma, or provider tokens. This project uses Pages Router, so `src/app/` is not a general application folder.

## Common status

The provider is already mounted globally. Use the combined hook when a component needs both clock and account:

```tsx
import { useCommonStatus } from '@/common/status'

const { localNow, localDate, authStatus, account } = useCommonStatus()
// localNow: ISO local timestamp with timezone offset, refreshed every second, initially null for SSR.
// localDate: YYYY-MM-DD in the browser’s local timezone, initially null.
// authStatus: 'loading' | 'authenticated' | 'unauthenticated'.
// account: { id, name, email } when authenticated, otherwise null.
```

Use `useCurrentAccount()` for account-only components and `useLocalClock()` for clock-only components. Account-only consumers do not re-render every second. Authentication state comes directly from SessionProvider; there is no separate writable account store or localStorage token. Handle `loading` and `null` before rendering account/clock values.

Local time uses the browser’s timezone and device clock and refreshes when the tab becomes visible. It is a display value, not a trusted server timestamp. Server endpoints authenticate requests independently using the session; passing a `userId` in a request cannot select another user's data.

## Checks

```bash
npm run test:unit -- --runInBand
npx prisma validate
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

`npm run build` generates the Prisma client and builds Next.js; it does **not** change the database. `npm run db:migrate` is the explicit migration command.

The full suite includes a real Gemini API call and requires credentials/network access:

```bash
npm test -- --runInBand
```

Record database integration tests are opt-in. They require `TEST_DATABASE_URL` and `DATABASE_URL` to point to the same disposable test database with migrations applied. They reset records belonging to their integration test user:

```bash
npm test -- --runInBand --testMatch='**/features/records/server/tests/*.test.ts'
```

Mocked authentication tests cover JWT/session mapping, registration adapter fields, page guards, per-user queries and lifecycle cancellation. Verify a real Google redirect/login/logout with configured credentials before deployment; those tests do not replace OAuth end-to-end verification.

The `/api/cron/keepalive` endpoint retains its separate `CRON_SECRET` bearer authentication and does not use an end-user session.
