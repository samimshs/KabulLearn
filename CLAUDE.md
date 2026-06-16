# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (always start fresh to avoid stale webpack chunks)
rm -rf .next && npm run dev -- --port 3002

# Type-check and build
npm run build

# Tests
npm test                          # run all tests
npx vitest run tests/lib/rbac.test.ts   # run a single test file

# Database
set -a && source .env.local && set +a   # required before any Prisma CLI command
npx prisma migrate dev --name <name>    # schema change → migration + client regen
npx prisma generate                     # regenerate client only
npm run db:seed                         # seed admin user + sample curriculum
```

**Important:** Prisma CLI does not auto-load `.env.local`. Always `source .env.local` before running any `prisma` command directly.

**Never run `npm run build` then `npm run dev` in the same session** — production chunks written to `.next` have different IDs than dev chunks, causing "Cannot find module './NNN.js'" errors. Always delete `.next` before switching modes.

## Architecture

### Role separation (strict, no overlap)

Three roles with completely separate route namespaces:

| Role | Route | How created |
|---|---|---|
| `STUDENT` | `/`, `/courses/*`, `/dashboard` | Self-registers at `/register` |
| `EDUCATOR` | `/educator`, `/educator/courses/*` | Registers as STUDENT, admin promotes |
| `ADMIN` | `/admin` | Created only via `npm run db:seed` |

Middleware (`proxy.ts`) enforces the boundary at the edge using the JWT-embedded role — it never touches the database. `lib/rbac.ts` enforces the same rules inside Server Actions via `requireAdmin()` / `requireEducator()`.

After login, `app/auth/redirect/page.tsx` reads the JWT role and redirects each role to its home page (`/admin`, `/educator`, or `/`).

### Auth split (edge vs. Node)

Auth.js is configured in two files intentionally:
- `auth.config.ts` — edge-safe, no Prisma/bcrypt imports; used by middleware
- `auth.ts` — full Node config with PrismaAdapter and bcrypt; used everywhere else

Sessions use **JWT strategy** so `auth()` never queries the database for session validation — only the initial login touches the DB.

### Bilingual content (EN / PS)

Student-facing pages support English and Pashto. The language state lives in `LanguageProvider` (client component, wraps the entire layout). All student-facing strings go through `lib/i18n.ts` dictionaries. When adding a new string, add it to **both** `en` and `ps` objects — TypeScript enforces key parity via `Dictionary` type.

Educator and admin dashboards are English-only.

RTL is handled dynamically: `LanguageProvider` sets `document.documentElement.dir` via `useEffect` when locale changes to `"ps"`.

### Server Actions pattern

All write operations live in `lib/actions/`. Every action must:
1. Call `requireAdmin()` or `requireEducator()` (never trust client-supplied role)
2. Validate inputs with Zod before any Prisma call
3. Return `ActionResult<T>` — `{ ok: true, data }` or `{ ok: false, error: string }` — never throw to the client

For educator actions, also call `canManageCourse(...)` to ensure the educator owns the course (admin bypasses this).

Quiz scoring is calculated server-side in `lib/actions/quiz-actions.ts`. Client-submitted scores are never trusted.

### Module gating

Module gating is a dual-source system:
- **Server**: `UserProgress` records where `lesson.isFinalTest = true` and `status = COMPLETED` determine which modules are passed
- **Client**: `lib/progress.ts` reads `localStorage` for optimistic unlocking (key format: `poharana:{courseId}:{moduleId}:quizPassed`)

Both sources are merged in the client component with the server values taking precedence. `isModuleUnlocked(moduleIndex, moduleIds, passedQuizzes)` implements the rule: module 0 is always unlocked; module N requires the quiz of module N-1 to be passed.

### Seeded course IDs

`prisma/seed.mjs` creates courses from `data/data.json` with composite string IDs:
- Course: e.g. `"intro-physics"`
- Module: `"intro-physics:kinematics"` (course:module)
- Lesson: `"intro-physics:position-velocity"` (course:lesson)
- Quiz lesson: `"intro-physics:kinematics:quiz"`

These IDs contain colons. Always use `encodeURIComponent(id)` when building `href` strings with these IDs — all lesson/quiz/module links in components already do this.

### DB resilience pattern

Every Server Component page wraps DB calls in `try/catch`. On failure:
- Pages that can degrade (homepage, admin, educator dashboard) show an amber "Database temporarily unavailable" banner rather than crashing
- Pages that cannot render without data (course, lesson, quiz) throw a descriptive error caught by the nearest `error.tsx`

`Header.tsx` wraps `auth()` in try/catch so a DB outage never crashes the root layout.

### Header split

`components/Header.tsx` is an async Server Component that calls `auth()` and passes `{ name, role } | null` to `components/HeaderClient.tsx` (client component). The client component renders role-specific nav: Admin link for ADMIN, Educator portal for EDUCATOR, My Courses for STUDENT, Register + Sign in for guests.

### Certificate flow

`lib/actions/certificate-actions.ts`:
- `getCourseCertificateStatus` — checks if all `isFinalTest = true` lessons are `COMPLETED`; reads the `Certificate` model
- `createCertificateIfEligible` — upserts a `Certificate` record with a `verificationCode` UUID
- PDF generation uses `pdfkit` in `app/courses/[courseId]/certificate/download/route.ts`

Eligibility requires every module to have a lesson marked `isFinalTest = true`. Courses without final tests cannot generate certificates.
