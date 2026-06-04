-- Add unified level column
ALTER TABLE "Course" ADD COLUMN "level" TEXT;

-- Migrate existing EN values to canonical lowercase keys
UPDATE "Course" SET "level" = 'beginner'     WHERE LOWER("levelEn") IN ('beginner', 'foundational', 'basic', 'intro');
UPDATE "Course" SET "level" = 'intermediate'  WHERE LOWER("levelEn") IN ('intermediate', 'middle');
UPDATE "Course" SET "level" = 'advanced'      WHERE LOWER("levelEn") IN ('advanced', 'expert');

-- Drop the three separate locale columns
ALTER TABLE "Course" DROP COLUMN IF EXISTS "levelEn";
ALTER TABLE "Course" DROP COLUMN IF EXISTS "levelPs";
ALTER TABLE "Course" DROP COLUMN IF EXISTS "levelDa";
