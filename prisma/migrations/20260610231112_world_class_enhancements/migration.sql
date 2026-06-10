-- AlterTable
ALTER TABLE "AnswerChoice" ADD COLUMN     "textDa" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "explanationDa" TEXT,
ADD COLUMN     "promptDa" TEXT;

-- CreateTable
CREATE TABLE "LessonNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titlePs" TEXT NOT NULL,
    "titleDa" TEXT,
    "descriptionEn" TEXT NOT NULL,
    "descriptionPs" TEXT NOT NULL,
    "descriptionDa" TEXT,
    "coverColor" TEXT NOT NULL DEFAULT '#0057FF',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathCourse" (
    "pathId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LearningPathCourse_pkey" PRIMARY KEY ("pathId","courseId")
);

-- CreateTable
CREATE TABLE "CourseAnnouncement" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonNote_userId_idx" ON "LessonNote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonNote_userId_lessonId_key" ON "LessonNote"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_slug_key" ON "LearningPath"("slug");

-- CreateIndex
CREATE INDEX "LearningPathCourse_courseId_idx" ON "LearningPathCourse"("courseId");

-- CreateIndex
CREATE INDEX "CourseAnnouncement_courseId_idx" ON "CourseAnnouncement"("courseId");

-- AddForeignKey
ALTER TABLE "LessonNote" ADD CONSTRAINT "LessonNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonNote" ADD CONSTRAINT "LessonNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathCourse" ADD CONSTRAINT "LearningPathCourse_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathCourse" ADD CONSTRAINT "LearningPathCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAnnouncement" ADD CONSTRAINT "CourseAnnouncement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
