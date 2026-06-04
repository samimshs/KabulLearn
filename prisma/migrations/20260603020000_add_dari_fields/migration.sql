-- AlterTable: Course — add nullable Dari fields
ALTER TABLE "Course" ADD COLUMN "titleDa"       TEXT,
                     ADD COLUMN "descriptionDa"  TEXT,
                     ADD COLUMN "levelDa"         TEXT;

-- AlterTable: Module — add nullable Dari fields
ALTER TABLE "Module" ADD COLUMN "titleDa"       TEXT,
                     ADD COLUMN "descriptionDa"  TEXT;

-- AlterTable: Lesson — add nullable Dari fields
ALTER TABLE "Lesson" ADD COLUMN "titleDa"       TEXT,
                     ADD COLUMN "descriptionDa"  TEXT,
                     ADD COLUMN "readingDa"       TEXT;
