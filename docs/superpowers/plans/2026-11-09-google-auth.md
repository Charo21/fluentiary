# Google authentication implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this approved design inline.

**Goal:** Add Google auto-registration, JWT sessions, per-user records and shared UTC/account status.
**Architecture:** NextAuth Google provider on Pages Router; Prisma User/Account persist identity, JWT sessions expose internal user ID. Split React contexts expose common status. Server APIs enforce identity independently.
**Tech Stack:** Existing Next.js 14 / React 18 / Prisma 7 / PostgreSQL; compatible NextAuth 4.
**Spec:** ../specs/2026-11-09-google-auth-design.md

## Global Constraints

No image/emailVerified/password columns or Session/VerificationToken tables. User permits deleting legacy records. Preserve existing refactor and document deletions. No push, deployment or unsolicited commit. Do not expose secrets. Work in the existing checkout to preserve uncommitted refactor; sandbox blocked Git branch creation.

## Review Focus

- Authenticated caller must never read/write another user's records, including forged request userId.
- OAuth missing email, changed email or concurrent account creation must not silently link a new identity by email.
- Expired session, date/account switch or stale responses must not save old drafts into a new record.
- Callback URLs must remain same-origin and reject protocol-relative/external URLs.
- Shared clock must be hydration-safe, refresh after visibility resume, and not re-render account-only consumers every second.

### Task 1: Identity and persistence

Files: prisma/schema.prisma, prisma/migrations/*_google_auth/migration.sql, src/features/auth/server/{adapter,options,session,pages}.ts, src/features/auth/redirect.ts, src/types/next-auth.d.ts, src/pages/api/auth/[...nextauth].ts; auth tests.
Interfaces: authOptions, getAccount(req,res) -> Promise<{id,name,email}|null>, requirePageSession(context), safeCallbackUrl(value) -> string.
- [x] Add tests for narrow User writes, provider identity lookup, JWT/session callbacks, page guards and safe redirects; run red.
- [x] Install compatible auth dependencies; implement custom Prisma adapter methods needed by Google/JWT, schema and migration; run auth tests green.
- [x] Validate schema and generate client. Migration is prepared; apply only after confirming target environment (no credentials currently configured).

### Task 2: Shared status and auth UI

Files: src/common/status/{types,CommonStatusProvider,index}.tsx/ts, src/features/auth/components/{LoginPage,AccountMenu,AuthBoundary}.tsx, src/pages/login.tsx, src/pages/_app.tsx, protected route entries and styles.
Interfaces: useCommonStatus() -> UTC clock plus account discriminated union; useCurrentAccount(), useUtcClock().
- [x] Add UI/clock tests for login/logout, auth states, SSR, UTC midnight, visibility and cleanup; run red.
- [x] Implement providers, guards, login and account UI; wire SessionProvider and protected routes; run green.

### Task 3: User-scoped business logic

Files: features/{records,refinement}/server handlers, records/hooks/useDailyRecord.ts, calendar/hooks/useRecordDates.ts and tests.
- [x] Add API tests proving 401/no DB access, composite keys, list filter and forged ID immunity; add lifecycle tests proving no save before load or after session loss/date change; run red.
- [x] Enforce account on every business API, use composite record key and account-scoped UI loading/saving with request cancellation; run green.
- [x] Update existing page/refinement tests with authenticated sessions and database integration fixtures with explicit test user.

### Task 4: Documentation and verification

Files: README.md, .env.example, package.json/package-lock.json, test configuration if needed.
- [x] Remove db push from build; document explicit migrate deploy, legacy deletion, Google callback URL and required env values.
- [x] Run local unit suite, schema validate, tsc, lint, next build; run full suite and report existing external Gemini dependency separately.
- [x] Obtain independent whole-change review; resolve important findings with tests; record actual migration and OAuth verification status.

Verification: full Jest suite 85/85 passes including Gemini; Prisma schema/client, TypeScript, ESLint and Next production build passed. Live HTTP checks passed for page/API guards, signed JWT account and redirects. SQL migration validated against disposable PGlite PostgreSQL including legacy deletion, user/date uniqueness and foreign keys. Real Google OAuth pending locally configured credentials. Existing database has not been migrated. Independent reviewer found no actionable new defect.
