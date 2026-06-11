CREATE TABLE "LessonBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonBookmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiChatLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "sources" JSONB,
    "rating" INTEGER,
    "feedback" TEXT,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LessonBookmark_userId_lessonId_key" ON "LessonBookmark"("userId", "lessonId");
CREATE INDEX "LessonBookmark_userId_idx" ON "LessonBookmark"("userId");
CREATE INDEX "LessonBookmark_lessonId_idx" ON "LessonBookmark"("lessonId");
CREATE INDEX "AiChatLog_userId_createdAt_idx" ON "AiChatLog"("userId", "createdAt");
CREATE INDEX "AiChatLog_courseId_idx" ON "AiChatLog"("courseId");
CREATE INDEX "AiChatLog_rating_idx" ON "AiChatLog"("rating");
CREATE INDEX "AiChatLog_createdAt_idx" ON "AiChatLog"("createdAt");

ALTER TABLE "LessonBookmark" ADD CONSTRAINT "LessonBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonBookmark" ADD CONSTRAINT "LessonBookmark_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiChatLog" ADD CONSTRAINT "AiChatLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
