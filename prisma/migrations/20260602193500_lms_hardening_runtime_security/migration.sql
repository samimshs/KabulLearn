-- LMS hardening: account activation, certificate UUIDs, video heartbeat,
-- quiz timing, and submission rate-limit buckets.

CREATE TYPE "UserStatus" AS ENUM ('VERIFICATION_PENDING', 'ACTIVE', 'SUSPENDED');

ALTER TABLE "User"
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "Certificate"
ADD COLUMN "uuid" UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX "Certificate_uuid_key" ON "Certificate"("uuid");

ALTER TABLE "QuizSubmission"
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "durationMs" INTEGER;

CREATE TABLE "LessonHeartbeat" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "positionSec" DOUBLE PRECISION NOT NULL,
  "durationSec" DOUBLE PRECISION NOT NULL,
  "consumedPct" DOUBLE PRECISION NOT NULL,
  "signature" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LessonHeartbeat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizAttemptSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),

  CONSTRAINT "QuizAttemptSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "LessonHeartbeat_userId_lessonId_createdAt_idx" ON "LessonHeartbeat"("userId", "lessonId", "createdAt");
CREATE INDEX "LessonHeartbeat_courseId_idx" ON "LessonHeartbeat"("courseId");

CREATE INDEX "QuizAttemptSession_userId_lessonId_startedAt_idx" ON "QuizAttemptSession"("userId", "lessonId", "startedAt");
CREATE INDEX "QuizAttemptSession_courseId_idx" ON "QuizAttemptSession"("courseId");

ALTER TABLE "LessonHeartbeat"
ADD CONSTRAINT "LessonHeartbeat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "LessonHeartbeat_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuizAttemptSession"
ADD CONSTRAINT "QuizAttemptSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "QuizAttemptSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
