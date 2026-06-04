-- CreateTable: CourseInstructor junction
CREATE TABLE "CourseInstructor" (
    "id"        TEXT NOT NULL,
    "courseId"  TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "order"     INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CourseInstructor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourseInstructor" ADD CONSTRAINT "CourseInstructor_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseInstructor" ADD CONSTRAINT "CourseInstructor_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "CourseInstructor_courseId_profileId_key" ON "CourseInstructor"("courseId", "profileId");
CREATE INDEX "CourseInstructor_courseId_idx" ON "CourseInstructor"("courseId");

-- Migrate existing primary authors into the junction table
INSERT INTO "CourseInstructor" ("id", "courseId", "profileId", "order")
SELECT gen_random_uuid()::text, c."id", c."authorProfileId", 0
FROM "Course" c
WHERE c."authorProfileId" IS NOT NULL;
