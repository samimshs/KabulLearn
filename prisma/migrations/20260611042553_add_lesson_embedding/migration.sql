-- CreateTable
CREATE TABLE "LessonEmbedding" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonEmbedding_lessonId_key" ON "LessonEmbedding"("lessonId");

-- AddForeignKey
ALTER TABLE "LessonEmbedding" ADD CONSTRAINT "LessonEmbedding_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
