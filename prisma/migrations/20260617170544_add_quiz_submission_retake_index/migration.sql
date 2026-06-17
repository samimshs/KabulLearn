-- DropIndex
DROP INDEX "ContentEmbedding_embedding_hnsw_idx";

-- CreateIndex
CREATE INDEX "QuizSubmission_userId_lessonId_passed_submittedAt_idx" ON "QuizSubmission"("userId", "lessonId", "passed", "submittedAt");
