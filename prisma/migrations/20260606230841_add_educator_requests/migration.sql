-- CreateEnum
CREATE TYPE "EducatorRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "EducatorRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "EducatorRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducatorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EducatorRequest_userId_key" ON "EducatorRequest"("userId");

-- CreateIndex
CREATE INDEX "EducatorRequest_status_idx" ON "EducatorRequest"("status");

-- AddForeignKey
ALTER TABLE "EducatorRequest" ADD CONSTRAINT "EducatorRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
