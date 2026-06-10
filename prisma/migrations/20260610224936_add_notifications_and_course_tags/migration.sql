-- CreateEnum
CREATE TYPE "AppNotificationKind" AS ENUM ('NEW_LESSON', 'DISCUSSION_REPLY', 'STREAK_ALERT', 'COURSE_REVIEW', 'GENERAL');

-- CreateTable
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AppNotificationKind" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "CourseTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseTagRelation" (
    "courseId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CourseTagRelation_pkey" PRIMARY KEY ("courseId","tagId")
);

-- CreateIndex
CREATE INDEX "AppNotification_userId_idx" ON "AppNotification"("userId");

-- CreateIndex
CREATE INDEX "AppNotification_userId_readAt_idx" ON "AppNotification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTag_label_key" ON "CourseTag"("label");

-- CreateIndex
CREATE UNIQUE INDEX "CourseTag_slug_key" ON "CourseTag"("slug");

-- CreateIndex
CREATE INDEX "CourseTagRelation_tagId_idx" ON "CourseTagRelation"("tagId");

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTagRelation" ADD CONSTRAINT "CourseTagRelation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseTagRelation" ADD CONSTRAINT "CourseTagRelation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "CourseTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
