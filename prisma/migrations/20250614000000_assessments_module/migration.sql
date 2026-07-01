-- CreateTable
CREATE TABLE "question_bank_items" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "question" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "options" JSONB,
    "correct_answer" TEXT,
    "code_template" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_bank_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN "max_retakes" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "assessments" ADD COLUMN "allow_retakes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "assessments" ADD COLUMN "shuffle_questions" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "assessment_questions" ADD COLUMN "bank_item_id" TEXT;
ALTER TABLE "assessment_questions" ADD COLUMN "code_template" TEXT;

ALTER TABLE "assessment_attempts" ADD COLUMN "attempt_number" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "assessment_attempts" ADD COLUMN "max_score" INTEGER;
ALTER TABLE "assessment_attempts" ADD COLUMN "passing_score" INTEGER;
ALTER TABLE "assessment_attempts" ADD COLUMN "passed" BOOLEAN;
ALTER TABLE "assessment_attempts" ADD COLUMN "feedback" TEXT;
ALTER TABLE "assessment_attempts" ADD COLUMN "expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "question_bank_items_type_idx" ON "question_bank_items"("type");
CREATE INDEX "question_bank_items_deleted_at_idx" ON "question_bank_items"("deleted_at");
CREATE INDEX "assessment_questions_bank_item_id_idx" ON "assessment_questions"("bank_item_id");
CREATE INDEX "assessment_attempts_passed_idx" ON "assessment_attempts"("passed");

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_bank_item_id_fkey" FOREIGN KEY ("bank_item_id") REFERENCES "question_bank_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
