-- Convert Certificate.id from legacy text/cuid values to PostgreSQL UUID primary keys.
-- No other table references Certificate.id, so existing certificate ownership and verification
-- relationships remain intact through userId/courseId and uuid.

ALTER TABLE "Certificate" DROP CONSTRAINT "Certificate_pkey";

ALTER TABLE "Certificate"
ADD COLUMN "newId" UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE "Certificate" DROP COLUMN "id";

ALTER TABLE "Certificate" RENAME COLUMN "newId" TO "id";

ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id");
