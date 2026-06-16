-- Enable pgvector extension (required for vector column type)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add optional title to CourseAnnouncement
ALTER TABLE "CourseAnnouncement" ADD COLUMN "title" TEXT;

-- Drop legacy rate limiter table (replaced by Upstash Redis)
DROP TABLE "RateLimitBucket";

-- Migrate ContentEmbedding.embedding from TEXT to vector(1536)
-- Existing text embeddings are dropped; admin must re-run the AI reindex after this migration.
ALTER TABLE "ContentEmbedding" DROP COLUMN "embedding";
ALTER TABLE "ContentEmbedding" ADD COLUMN "embedding" vector(1536);

-- HNSW index for cosine similarity ANN search
CREATE INDEX "ContentEmbedding_embedding_hnsw_idx" ON "ContentEmbedding" USING hnsw (embedding vector_cosine_ops);
