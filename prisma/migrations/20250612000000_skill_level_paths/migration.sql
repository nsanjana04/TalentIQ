-- CreateTable
CREATE TABLE "skill_level_paths" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "skill_level_id" TEXT NOT NULL,
    "course_id" TEXT,
    "assessment_id" TEXT,
    "certificate_template_id" TEXT,
    "title" TEXT,
    "description" TEXT,
    "estimated_days" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_level_paths_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_level_paths_skill_id_skill_level_id_key" ON "skill_level_paths"("skill_id", "skill_level_id");
CREATE INDEX "skill_level_paths_skill_id_idx" ON "skill_level_paths"("skill_id");
CREATE INDEX "skill_level_paths_skill_level_id_idx" ON "skill_level_paths"("skill_level_id");
CREATE INDEX "skill_level_paths_sort_order_idx" ON "skill_level_paths"("sort_order");
CREATE INDEX "skill_level_paths_deleted_at_idx" ON "skill_level_paths"("deleted_at");

-- AddForeignKey
ALTER TABLE "skill_level_paths" ADD CONSTRAINT "skill_level_paths_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_level_paths" ADD CONSTRAINT "skill_level_paths_skill_level_id_fkey" FOREIGN KEY ("skill_level_id") REFERENCES "skill_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "skill_level_paths" ADD CONSTRAINT "skill_level_paths_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "skill_level_paths" ADD CONSTRAINT "skill_level_paths_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "skill_level_paths" ADD CONSTRAINT "skill_level_paths_certificate_template_id_fkey" FOREIGN KEY ("certificate_template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
