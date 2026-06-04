/*
  Warnings:

  - You are about to drop the column `level` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "level",
ADD COLUMN     "levelEn" TEXT,
ADD COLUMN     "levelPs" TEXT;
