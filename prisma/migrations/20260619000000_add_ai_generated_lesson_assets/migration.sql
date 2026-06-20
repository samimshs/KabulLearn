-- Store AI-generated slide outlines, narration scripts, and video-generation plans.
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "aiGeneratedAssets" JSONB;
