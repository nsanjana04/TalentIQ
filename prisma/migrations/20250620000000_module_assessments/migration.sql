-- Phase 1: Module-level assessments with progression gating

ALTER TABLE "course_modules" ADD COLUMN "assessment_id" TEXT;
ALTER TABLE "course_modules" ADD COLUMN "require_quiz_pass" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "course_modules_assessment_id_idx" ON "course_modules"("assessment_id");

ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_assessment_id_fkey"
  FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
