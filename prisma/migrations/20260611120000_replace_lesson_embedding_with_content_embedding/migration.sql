DROP TABLE IF EXISTS "LessonEmbedding";

CREATE TABLE "ContentEmbedding" (
    "id"        TEXT NOT NULL,
    "source"    TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentEmbedding_source_sourceKey_key" ON "ContentEmbedding"("source", "sourceKey");
CREATE INDEX "ContentEmbedding_source_idx" ON "ContentEmbedding"("source");
