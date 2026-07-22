-- CreateEnum
CREATE TYPE "SkillRelationType" AS ENUM ('PREREQUISITE', 'RELATED', 'COMPLEMENTARY');

-- CreateTable
CREATE TABLE "skill_relations" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "related_skill_id" TEXT NOT NULL,
    "relation_type" "SkillRelationType" NOT NULL DEFAULT 'RELATED',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_course_mappings" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "coverage_percent" INTEGER NOT NULL DEFAULT 100,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_course_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_assessment_mappings" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_assessment_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_certificate_mappings" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "certificate_template_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_certificate_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_validity_rules" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "validity_days" INTEGER NOT NULL DEFAULT 365,
    "grace_period_days" INTEGER NOT NULL DEFAULT 30,
    "requires_recertification" BOOLEAN NOT NULL DEFAULT true,
    "reassessment_days_before_expiry" INTEGER NOT NULL DEFAULT 60,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_validity_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_weightage_rules" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "job_role_id" TEXT,
    "experience_level_id" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 10,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_weightage_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_relations_skill_id_related_skill_id_key" ON "skill_relations"("skill_id", "related_skill_id");
CREATE INDEX "skill_relations_skill_id_idx" ON "skill_relations"("skill_id");
CREATE INDEX "skill_relations_related_skill_id_idx" ON "skill_relations"("related_skill_id");
CREATE INDEX "skill_relations_deleted_at_idx" ON "skill_relations"("deleted_at");

CREATE UNIQUE INDEX "skill_course_mappings_skill_id_course_id_key" ON "skill_course_mappings"("skill_id", "course_id");
CREATE INDEX "skill_course_mappings_skill_id_idx" ON "skill_course_mappings"("skill_id");
CREATE INDEX "skill_course_mappings_course_id_idx" ON "skill_course_mappings"("course_id");
CREATE INDEX "skill_course_mappings_deleted_at_idx" ON "skill_course_mappings"("deleted_at");

CREATE UNIQUE INDEX "skill_assessment_mappings_skill_id_assessment_id_key" ON "skill_assessment_mappings"("skill_id", "assessment_id");
CREATE INDEX "skill_assessment_mappings_skill_id_idx" ON "skill_assessment_mappings"("skill_id");
CREATE INDEX "skill_assessment_mappings_assessment_id_idx" ON "skill_assessment_mappings"("assessment_id");
CREATE INDEX "skill_assessment_mappings_deleted_at_idx" ON "skill_assessment_mappings"("deleted_at");

CREATE UNIQUE INDEX "skill_certificate_mappings_skill_id_certificate_template_id_key" ON "skill_certificate_mappings"("skill_id", "certificate_template_id");
CREATE INDEX "skill_certificate_mappings_skill_id_idx" ON "skill_certificate_mappings"("skill_id");
CREATE INDEX "skill_certificate_mappings_certificate_template_id_idx" ON "skill_certificate_mappings"("certificate_template_id");
CREATE INDEX "skill_certificate_mappings_deleted_at_idx" ON "skill_certificate_mappings"("deleted_at");

CREATE UNIQUE INDEX "skill_validity_rules_skill_id_key" ON "skill_validity_rules"("skill_id");
CREATE INDEX "skill_validity_rules_deleted_at_idx" ON "skill_validity_rules"("deleted_at");

CREATE INDEX "skill_weightage_rules_skill_id_idx" ON "skill_weightage_rules"("skill_id");
CREATE INDEX "skill_weightage_rules_job_role_id_idx" ON "skill_weightage_rules"("job_role_id");
CREATE INDEX "skill_weightage_rules_experience_level_id_idx" ON "skill_weightage_rules"("experience_level_id");
CREATE INDEX "skill_weightage_rules_deleted_at_idx" ON "skill_weightage_rules"("deleted_at");

-- AddForeignKey
ALTER TABLE "skill_relations" ADD CONSTRAINT "skill_relations_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_relations" ADD CONSTRAINT "skill_relations_related_skill_id_fkey" FOREIGN KEY ("related_skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_course_mappings" ADD CONSTRAINT "skill_course_mappings_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_course_mappings" ADD CONSTRAINT "skill_course_mappings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_assessment_mappings" ADD CONSTRAINT "skill_assessment_mappings_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_assessment_mappings" ADD CONSTRAINT "skill_assessment_mappings_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_certificate_mappings" ADD CONSTRAINT "skill_certificate_mappings_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_certificate_mappings" ADD CONSTRAINT "skill_certificate_mappings_certificate_template_id_fkey" FOREIGN KEY ("certificate_template_id") REFERENCES "certificate_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_validity_rules" ADD CONSTRAINT "skill_validity_rules_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_weightage_rules" ADD CONSTRAINT "skill_weightage_rules_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_weightage_rules" ADD CONSTRAINT "skill_weightage_rules_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_weightage_rules" ADD CONSTRAINT "skill_weightage_rules_experience_level_id_fkey" FOREIGN KEY ("experience_level_id") REFERENCES "experience_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
