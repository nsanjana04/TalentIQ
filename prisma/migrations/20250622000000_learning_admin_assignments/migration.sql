-- Learning Administration: course levels and structured assignments

-- CreateEnum
CREATE TYPE "CourseAdminStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "CourseLevelTier" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE "AssignmentTargetType" AS ENUM ('USER', 'DEPARTMENT', 'TEAM', 'ROLE', 'ORGANIZATION');
CREATE TYPE "CourseAssignmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN "category" TEXT;
ALTER TABLE "courses" ADD COLUMN "skills_covered" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "courses" ADD COLUMN "admin_status" "CourseAdminStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "courses" ADD COLUMN "created_by_id" TEXT;

-- CreateTable
CREATE TABLE "course_levels" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "tier" "CourseLevelTier" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_hours" INTEGER NOT NULL DEFAULT 4,
    "learning_objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "passing_score" INTEGER NOT NULL DEFAULT 70,
    "order_number" INTEGER NOT NULL,
    "unlock_rule" TEXT,
    "certificate_enabled" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_levels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_assignment_batches" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "course_level_id" TEXT NOT NULL,
    "target_type" "AssignmentTargetType" NOT NULL,
    "target_id" TEXT,
    "assigned_by_user_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "total_users" INTEGER NOT NULL DEFAULT 0,
    "completed_users" INTEGER NOT NULL DEFAULT 0,
    "overdue_users" INTEGER NOT NULL DEFAULT 0,
    "status" "CourseAssignmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "priority" TEXT,
    "notes" TEXT,
    "reminder_schedule" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_assignment_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_assignment_users" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT,
    "course_id" TEXT NOT NULL,
    "course_level_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_by_user_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "CourseAssignmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_assignment_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_levels_course_id_tier_key" ON "course_levels"("course_id", "tier");
CREATE INDEX "course_levels_course_id_idx" ON "course_levels"("course_id");
CREATE INDEX "course_levels_order_number_idx" ON "course_levels"("order_number");
CREATE INDEX "course_levels_deleted_at_idx" ON "course_levels"("deleted_at");

CREATE INDEX "courses_admin_status_idx" ON "courses"("admin_status");
CREATE INDEX "courses_created_by_id_idx" ON "courses"("created_by_id");

CREATE INDEX "course_assignment_batches_course_id_idx" ON "course_assignment_batches"("course_id");
CREATE INDEX "course_assignment_batches_course_level_id_idx" ON "course_assignment_batches"("course_level_id");
CREATE INDEX "course_assignment_batches_target_type_idx" ON "course_assignment_batches"("target_type");
CREATE INDEX "course_assignment_batches_status_idx" ON "course_assignment_batches"("status");
CREATE INDEX "course_assignment_batches_due_date_idx" ON "course_assignment_batches"("due_date");

CREATE INDEX "course_assignment_users_batch_id_idx" ON "course_assignment_users"("batch_id");
CREATE INDEX "course_assignment_users_course_id_idx" ON "course_assignment_users"("course_id");
CREATE INDEX "course_assignment_users_course_level_id_idx" ON "course_assignment_users"("course_level_id");
CREATE INDEX "course_assignment_users_user_id_idx" ON "course_assignment_users"("user_id");
CREATE INDEX "course_assignment_users_status_idx" ON "course_assignment_users"("status");
CREATE INDEX "course_assignment_users_due_date_idx" ON "course_assignment_users"("due_date");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course_levels" ADD CONSTRAINT "course_levels_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_assignment_batches" ADD CONSTRAINT "course_assignment_batches_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "course_assignment_batches" ADD CONSTRAINT "course_assignment_batches_course_level_id_fkey" FOREIGN KEY ("course_level_id") REFERENCES "course_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "course_assignment_batches" ADD CONSTRAINT "course_assignment_batches_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "course_assignment_users" ADD CONSTRAINT "course_assignment_users_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "course_assignment_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "course_assignment_users" ADD CONSTRAINT "course_assignment_users_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "course_assignment_users" ADD CONSTRAINT "course_assignment_users_course_level_id_fkey" FOREIGN KEY ("course_level_id") REFERENCES "course_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "course_assignment_users" ADD CONSTRAINT "course_assignment_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_assignment_users" ADD CONSTRAINT "course_assignment_users_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
