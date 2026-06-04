-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'TEXT_INPUT';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "correctAnswer" TEXT;

-- AlterTable
ALTER TABLE "QuizSubmissionAnswer" ADD COLUMN     "textAnswer" TEXT,
ALTER COLUMN "answerChoiceId" DROP NOT NULL;
