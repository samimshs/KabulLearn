# PohaRana

PohaRana is a Next.js LMS for Afghan learners. Student-facing learning content supports English and Pashto, while creator/educator and admin workflows are English-only.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

If another app is already using port 3000:

```bash
npm run dev -- --port 3002
```

Open `http://localhost:3002`.

## Database Setup

Create `.env.local` from `.env.example`, then set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_TRUST_HOST="true"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-at-least-12-characters"
SEED_ADMIN_NAME="PohaRana Admin"
```

Then run:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Current Structure

- `prisma/schema.prisma`: PostgreSQL LMS schema.
- `prisma/seed.mjs`: optional initial admin bootstrap.
- `auth.ts`: Node/runtime Auth.js config with credentials auth and Prisma adapter.
- `auth.config.ts`: edge-safe Auth.js config used by middleware.
- `app/api/auth/[...nextauth]/route.ts`: Auth.js route handler.
- `middleware.ts`: route protection for `/admin` and `/educator`.
- `lib/db.ts`: Prisma singleton.
- `lib/rbac.ts`: server-side auth and role helpers.
- `lib/actions/course-actions.ts`: initial secure course workflow actions.
- `lib/actions/certificate-actions.ts`: certificate eligibility and issuance logic.
- `lib/validators`: Zod input validators.
- `app/courses/[courseId]/certificate`: course certificate UI and download route.
- Student-facing course, lesson, and quiz content is now served from published course queries in the database.
- `components`: current student-facing course, lesson, quiz, language, and video components.

## Language Policy

- Student-facing content supports English and Pashto.
- Pashto student pages must preserve RTL behavior.
- Creator/educator dashboards are English-only.
- Admin dashboards are English-only.
- Dynamic learning records use bilingual fields for course, module, lesson, reading, quiz, question, and answer-choice content.

## LMS Upgrade Tracker

Status legend: `[ ]` not started, `[~]` in progress, `[x]` complete, `[!]` blocked or needs review.

### Phase 0: Project Consolidation

- [x] Rename active education app from PohaHub to PohaRana.
- [x] Confirm active source lives in `projects/PohaRana`.
- [x] Confirm old `projects/PohaHub` contains no source files outside stale `.next` output.
- [x] Remove obsolete `projects/PohaHub` folder after audit.
- [ ] Update any public links from PohaHub to PohaRana.
- [ ] Add PohaRana link from the KabulHub education page when ready.

### Phase 1: Database Schema & Authentication

- [x] Approve the Prisma/PostgreSQL standard stack.
- [x] Install Prisma and initialize `prisma/schema.prisma`.
- [x] Add database and auth environment variable template in `.env.example`.
- [x] Install and configure Auth.js/NextAuth.
- [x] Configure credentials login against `User.passwordHash`.
- [x] Add credential login page.
- [x] Add logout action/button.
- [x] Add Auth.js Prisma adapter tables.
- [x] Add role enum: `STUDENT`, `EDUCATOR`, `ADMIN`.
- [x] Implement typed session role propagation.
- [x] Implement secure session helpers for server components and Server Actions.
- [x] Implement RBAC guards for student, educator, and admin access.
- [x] Protect `/educator` and `/admin` route namespaces with middleware.
- [x] Add course schema with student-facing English and Pashto fields.
- [x] Add module schema with ordering and student-facing localized fields.
- [x] Add lesson schema with `VIDEO`, `READING`, and `QUIZ` types.
- [x] Add quiz, question, answer choice, and submission schema.
- [x] Add user progress schema for completed lessons and scores.
- [x] Add seed script for an initial admin user.
- [x] Validate Prisma schema.
- [x] Generate Prisma client.
- [x] Connect a real PostgreSQL database and run the first migration.
- [x] Seed the initial admin user in the live database.
- [x] Add sample bilingual content seed after DB is connected.

### Phase 2: Content Management & Workflows

- [x] Build secured `/educator` route.
- [x] Add initial educator course creation/list/submit UI.
- [x] Add full educator course edit/delete UI.
- [x] Add backend educator course creation action.
- [x] Add educator module CRUD actions and UI.
- [x] Add educator lesson CRUD actions and UI for video, reading, and quiz lessons.
- [x] Add course statuses: `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`.
- [x] Implement backend educator submit-for-review action.
- [x] Build secured `/admin` route.
- [x] Add admin pending-course review queue.
- [x] Implement backend admin publish action.
- [x] Add backend admin reject action.
- [x] Add admin user management and role assignment.
- [x] Add basic platform analytics.

### Phase 3: Student Experience & Assessments

- [x] Replace mock `data/data.json` reads with database-backed published course queries.
- [x] Build dynamic database-backed course route.
- [x] Build dynamic database-backed lesson route.
- [x] Render YouTube embeds for `VIDEO` lessons from the database.
- [x] Render Markdown/Rich Text for `READING` lessons from the database.
- [x] Build client-side quiz interface for `QUIZ` lessons.
- [x] Evaluate quiz submissions through a secure Server Action.
- [x] Store quiz submissions and selected answers.
- [x] Mark lessons complete after required conditions are met.
- [x] Implement module gating based on quiz pass results and prior module completion.
- [x] Display locked state for unavailable modules.
- [x] Add course progress overview for students.

### Phase 4: Certificates

- [x] Define certificate eligibility rules.
- [x] Add certificate model after core progress logic is approved.
- [x] Generate PDF certificate when course completion reaches 100% with passing grades.
- [x] Include student name, course title, and completion date.
- [x] Add certificate download route.
- [x] Add certificate verification identifier.

### Phase 5: Localization & Accessibility

- [x] Define student-only bilingual policy.
- [x] Ensure all dynamic student content supports English and Pashto.
- [x] Preserve RTL behavior for Pashto UI.
- [x] Add fallback behavior when a translation is missing.
- [x] Audit forms, dashboards, and quizzes for keyboard navigation.
- [x] Add accessible labels and error states for all secured workflows.

### Phase 6: Security & Quality

- [x] Validate initial Server Action inputs with Zod.
- [x] Enforce RBAC in server-side action helpers.
- [x] Prevent educators from submitting courses they do not own unless admin.
- [x] Add audit fields to core records.
- [x] Split Auth.js config so middleware does not import Prisma or bcrypt.
- [x] Run production build after Phase 1 backend setup.
- [x] Add tests for RBAC helpers.
- [x] Add tests for progression and gating rules.
- [x] Add tests for quiz scoring.
- [x] Production build verified clean (Next.js 15 + TypeScript strict).

### Phase 7: Enrollment & Student Dashboard (Coursera-style)

- [x] Add `Certificate` model to Prisma schema and run migration.
- [x] Add `enrollInCourse` server action with ownership guards.
- [x] Add `Enroll for free` button on course overview for unauthenticated and non-enrolled users.
- [x] Build `/dashboard` My Courses page showing enrolled courses with progress bars.
- [x] Show enrollment count per course on the homepage.
- [x] Redirect unauthenticated users to login on enroll attempt.

### Phase 8: Course Discovery (Coursera-style)

- [x] Add full-text search bar on the course homepage.
- [x] Add level filter dropdown on the course homepage.
- [x] Show `no results` state when search returns nothing.
- [x] Course cards show enrollment count and module progress.

### Phase 9: Educator Quiz Builder (Khan Academy-style)

- [x] Add `/educator/courses/[courseId]/quizzes/[lessonId]` quiz builder page.
- [x] Add `Edit quiz` button on quiz lessons in the educator course view.
- [x] Build `QuizBuilderForm` with live add/delete question and choice UI.
- [x] Enforce educator ownership RBAC on all quiz builder actions.
- [x] Support bilingual prompts (EN + PS) and optional per-question explanations.

### Phase 10: Enhanced Quiz Experience (Khan Academy-style)

- [x] Show per-question correct/incorrect highlighting after quiz submission.
- [x] Reveal per-question explanations after submission.
- [x] Add `Try again` button after a failed attempt instead of requiring page reload.
- [x] Disable answer choices after submission to prevent accidental changes.
- [x] Color-code quiz cards green (pass) / red (fail) after submission.

### Phase 11: Navigation & Auth UX

- [x] Add sign-in link in the header for unauthenticated users.
- [x] Show user name and `My Courses` link in the header for signed-in students.
- [x] Split `Header` into server + client components for auth-aware rendering.

### Phase 12: Current Completed Enhancements

- [x] Prevent failed quizzes from revealing correct answer choices.
- [x] Add course ratings after completion.
- [x] Show rating averages on course cards and course detail pages.
- [x] Improve creator workspace layout so courses appear immediately.
- [x] Clean up empty optional URL validation for lessons and instructor photos.
- [x] Add modal confirmation before admin deletes a user.

### Future Enhancement Todo

- [x] Add uploaded image support for instructor profile photos instead of URL-only photos.
- [x] Add drag-and-drop ordering for modules, lessons, questions, and choices.
- [x] Add rich text or Markdown editing for reading lessons.
- [x] Add admin review history so every return/publish decision is preserved.
- [x] Add course discussion or Q&A threads for students.
- [x] Add educator analytics for lesson completion, quiz attempts, and ratings.
- [x] Add certificate verification public lookup page.
- [x] Add email notification queue records for course returns and approvals.
- [x] Add draft preview mode so educators can view courses before publishing.
- [x] Add rubric-style admin review checklist for course quality.

# New Requirements - LMS Hardening Checklist

## 1. Video Telemetry & Watch-Time Enforcement
- [ ] Initialize YouTube IFrame Player API within the Next.js video component.
- [ ] Implement `getCurrentTime()` and `getDuration()` polling to track actual consumption.
- [ ] Block the "Complete Lesson" mutation unless the watched duration exceeds the 90% threshold.
- [ ] Deploy a heartbeat client-to-server ping during video playback to prevent console-based payload spoofing.

## 2. API Security & Anti-Spoofing
- [ ] Audit all Next.js Server Actions handling lesson completion to enforce PostgreSQL database lookups for prerequisite module completion.
- [ ] Reject any progress mutation relying solely on client-side state.
- [ ] Implement server-side timestamp validation for quizzes; reject submissions where `submission_time - start_time` is impossibly low.
- [ ] Apply API rate limiting on PostgreSQL connection pools to prevent automated submission exhaustion.

## 3. Certificate Verifiability
- [ ] Create a `Certificates` table in PostgreSQL utilizing UUIDs as primary keys.
- [ ] Write a server action that generates a UUID upon a learner passing the final module test with >80%.
- [ ] Build a public, unauthenticated Next.js route (`/verify/[certificate_uuid]`) to return learner name, course title, and timestamp.
- [ ] Embed the `/verify/[certificate_uuid]` URL as a generated QR code onto the final PDF certificate.

## 4. Bilingual Delivery & RTL Optimization
- [ ] Bind the Next.js HTML `dir` attribute dynamically to the active locale (En = `ltr`, Pa = `rtl`).
- [ ] Replace all fixed directional Tailwind CSS classes (`ml-`, `mr-`, `pl-`, `pr-`) with logical properties (`ms-`, `me-`, `ps-`, `pe-`) across the codebase to ensure layouts mirror correctly.
- [ ] Optimize PostgreSQL queries to execute `SELECT` strictly on the active language columns or JSON keys, preventing over-fetching of unused Pashto or English text to the client.

## 5. Identity Verification & Email Enforcement
- [x] Enforce a `VERIFICATION_PENDING` status in the PostgreSQL `Users` table upon initial registration. Hard-block access to all LMS content and API routes until this status is resolved.
- [x] Integrate a transactional email service (e.g., Resend, SendGrid, or AWS SES) to dispatch outbound verification emails.
- [x] Generate a cryptographically secure, time-limited token (TTL: 15 minutes) upon registration, hash it, and store it in a `VerificationTokens` table alongside the user's ID.
- [x] Dispatch a "Magic Link" or 6-digit OTP to the provided email. The server must validate this token against the database to toggle the user status to `ACTIVE`.
- [x] Implement a server-side blocklist array to reject registrations from known disposable/temporary email domains (e.g., Mailinator, 10minutemail) before database insertion.
- [x] (Optional) Integrate OAuth 2.0 providers (e.g., Google) via your auth library to offload identity verification entirely, allowing users to bypass manual email confirmation.
- [x] Build frontend holding page (`/verify-request`) and processing route (`/verify`) to handle user states.

## Server Action Security Notes

- All write actions must call a server-side session helper before touching data.
- Role checks must be enforced in actions and route handlers, not only in rendered UI.
- Educators may only mutate courses where `course.authorId === session.user.id`.
- Admins may mutate all courses and users.
- Student access must check `Course.status === PUBLISHED`.
- Module gating must be calculated server-side from `UserProgress` and `QuizSubmission`.
- Quiz scoring must be calculated server-side from stored correct answers.
- Client-submitted scores must never be trusted.
- All inputs should be validated before Prisma calls.

# New Requirements - LMS Hardening Checklist

## 1. Video Telemetry & Watch-Time Enforcement
- [x] Initialize YouTube IFrame Player API within the Next.js video component.
- [x] Implement `getCurrentTime()` and `getDuration()` polling to track actual consumption.
- [x] Block the "Complete Lesson" mutation unless the watched duration exceeds the 90% threshold.
- [x] Deploy a heartbeat client-to-server ping during video playback to prevent console-based payload spoofing.

## 2. API Security & Anti-Spoofing
- [x] Audit all Next.js Server Actions handling lesson completion to enforce PostgreSQL database lookups for prerequisite module completion.
- [x] Reject any progress mutation relying solely on client-side state.
- [x] Implement server-side timestamp validation for quizzes; reject submissions where `submission_time - start_time` is impossibly low.
- [x] Apply API rate limiting on PostgreSQL connection pools to prevent automated submission exhaustion.

## 3. Certificate Verifiability
- [x] Create a `Certificates` table in PostgreSQL utilizing UUIDs as primary keys.
- [x] Write a server action that generates a UUID upon a learner passing the final module test with >80%.
- [x] Build a public, unauthenticated Next.js route (`/verify/[certificate_uuid]`) to return learner name, course title, and timestamp.
- [x] Embed the `/verify/[certificate_uuid]` URL as a generated QR code onto the final PDF certificate.

## 4. Bilingual Delivery & RTL Optimization
- [x] Bind the Next.js HTML `dir` attribute dynamically to the active locale (En = `ltr`, Pa = `rtl`).
- [x] Replace all fixed directional Tailwind CSS classes (`ml-`, `mr-`, `pl-`, `pr-`) with logical properties (`ms-`, `me-`, `ps-`, `pe-`) across the codebase to ensure layouts mirror correctly.
- [x] Optimize PostgreSQL queries to execute `SELECT` strictly on the active language columns or JSON keys, preventing over-fetching of unused Pashto or English text to the client.

## 6. Production Readiness Pass
- [x] Confirm `DATABASE_URL` is configured.
- [x] Confirm `AUTH_SECRET` and `AUTH_TRUST_HOST` are configured.
- [x] Confirm `RESEND_API_KEY` and `FROM_EMAIL` are configured.
- [x] Confirm `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured.
- [ ] Set `NEXTAUTH_URL` or `AUTH_URL` to the production domain before deployment.
- [ ] Add Google OAuth production callback URL in Google Cloud Console: `https://YOUR_DOMAIN/api/auth/callback/google`.
- [ ] Verify the Resend sender domain is production-approved.
- [ ] Enable automated PostgreSQL backups before public launch.

## 5. Identity Verification & Email Enforcement
- [x] Enforce a `VERIFICATION_PENDING` status in the PostgreSQL `Users` table upon initial registration. Hard-block access to all LMS content and API routes until this status is resolved.
- [x] Integrate a transactional email service (e.g., Resend, SendGrid, or AWS SES) to dispatch outbound verification emails.
- [x] Generate a cryptographically secure, time-limited token (TTL: 15 minutes) upon registration, hash it, and store it in a `VerificationTokens` table alongside the user's ID.
- [x] Dispatch a "Magic Link" or 6-digit OTP to the provided email. The server must validate this token against the database to toggle the user status to `ACTIVE`.
- [x] Implement a server-side blocklist array to reject registrations from known disposable/temporary email domains (e.g., Mailinator, 10minutemail) before database insertion.
- [x] (Optional) Integrate OAuth 2.0 providers (e.g., Google) via your auth library to offload identity verification entirely, allowing users to bypass manual email confirmation.
- [x] Build frontend holding page (`/verify-request`) and processing route (`/verify`) to handle user states.
