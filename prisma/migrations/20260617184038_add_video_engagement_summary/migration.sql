-- CreateTable
CREATE TABLE "VideoEngagementSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "activityDate" DATE NOT NULL,
    "maxConsumedPct" DOUBLE PRECISION NOT NULL,
    "maxPositionSec" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoEngagementSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoEngagementSummary_userId_idx" ON "VideoEngagementSummary"("userId");

-- CreateIndex
CREATE INDEX "VideoEngagementSummary_lessonId_idx" ON "VideoEngagementSummary"("lessonId");

-- CreateIndex
CREATE INDEX "VideoEngagementSummary_courseId_idx" ON "VideoEngagementSummary"("courseId");

-- CreateIndex
CREATE INDEX "VideoEngagementSummary_activityDate_idx" ON "VideoEngagementSummary"("activityDate");

-- CreateIndex
CREATE UNIQUE INDEX "VideoEngagementSummary_userId_lessonId_activityDate_key" ON "VideoEngagementSummary"("userId", "lessonId", "activityDate");
