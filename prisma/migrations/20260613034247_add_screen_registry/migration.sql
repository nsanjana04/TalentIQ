-- CreateEnum
CREATE TYPE "LearningResourceType" AS ENUM ('LINK', 'YOUTUBE', 'PDF', 'DOCUMENT', 'VIDEO', 'MICROSOFT_LEARN', 'UDEMY', 'COURSERA', 'OTHER');

-- CreateEnum
CREATE TYPE "OpenCourseCategory" AS ENUM ('PRODUCT', 'HR_POLICIES', 'SECURITY', 'GENERAL');

-- CreateEnum
CREATE TYPE "SsoProvider" AS ENUM ('OKTA', 'AZURE_AD', 'GOOGLE');

-- CreateEnum
CREATE TYPE "ScreenOverrideType" AS ENUM ('ALLOW', 'DENY');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "user_identities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "SsoProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LearningResourceType" NOT NULL DEFAULT 'LINK',
    "url" TEXT NOT NULL,
    "provider" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "OpenCourseCategory" NOT NULL DEFAULT 'GENERAL',
    "type" "LearningResourceType" NOT NULL DEFAULT 'YOUTUBE',
    "url" TEXT NOT NULL,
    "provider" TEXT,
    "thumbnail_url" TEXT,
    "duration_minutes" INTEGER,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "open_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_course_completions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "open_course_id" TEXT NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "open_course_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_course_assignments" (
    "id" TEXT NOT NULL,
    "open_course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "open_course_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resource_assignments" (
    "id" TEXT NOT NULL,
    "learning_resource_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_resource_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screens" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "route" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "parent_key" TEXT,
    "section_order" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "required_permission" TEXT,
    "is_sidebar_item" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_personal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_screen_access" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "screen_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_manage" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_screen_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_screen_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "screen_id" TEXT NOT NULL,
    "enabled" BOOLEAN,
    "override_type" "ScreenOverrideType" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_screen_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screen_access_audits" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "target_role_id" TEXT,
    "target_user_id" TEXT,
    "screen_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before_json" TEXT,
    "after_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screen_access_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_identities_user_id_idx" ON "user_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_external_id_key" ON "user_identities"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_user_id_provider_key" ON "user_identities"("user_id", "provider");

-- CreateIndex
CREATE INDEX "learning_resources_type_idx" ON "learning_resources"("type");

-- CreateIndex
CREATE INDEX "learning_resources_is_published_idx" ON "learning_resources"("is_published");

-- CreateIndex
CREATE INDEX "learning_resources_sort_order_idx" ON "learning_resources"("sort_order");

-- CreateIndex
CREATE INDEX "learning_resources_deleted_at_idx" ON "learning_resources"("deleted_at");

-- CreateIndex
CREATE INDEX "open_courses_category_idx" ON "open_courses"("category");

-- CreateIndex
CREATE INDEX "open_courses_is_mandatory_idx" ON "open_courses"("is_mandatory");

-- CreateIndex
CREATE INDEX "open_courses_is_published_idx" ON "open_courses"("is_published");

-- CreateIndex
CREATE INDEX "open_courses_sort_order_idx" ON "open_courses"("sort_order");

-- CreateIndex
CREATE INDEX "open_courses_deleted_at_idx" ON "open_courses"("deleted_at");

-- CreateIndex
CREATE INDEX "open_course_completions_user_id_idx" ON "open_course_completions"("user_id");

-- CreateIndex
CREATE INDEX "open_course_completions_open_course_id_idx" ON "open_course_completions"("open_course_id");

-- CreateIndex
CREATE INDEX "open_course_completions_status_idx" ON "open_course_completions"("status");

-- CreateIndex
CREATE INDEX "open_course_completions_deleted_at_idx" ON "open_course_completions"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "open_course_completions_user_id_open_course_id_key" ON "open_course_completions"("user_id", "open_course_id");

-- CreateIndex
CREATE INDEX "open_course_assignments_open_course_id_idx" ON "open_course_assignments"("open_course_id");

-- CreateIndex
CREATE INDEX "open_course_assignments_user_id_idx" ON "open_course_assignments"("user_id");

-- CreateIndex
CREATE INDEX "open_course_assignments_assigned_by_id_idx" ON "open_course_assignments"("assigned_by_id");

-- CreateIndex
CREATE INDEX "open_course_assignments_deleted_at_idx" ON "open_course_assignments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "open_course_assignments_open_course_id_user_id_key" ON "open_course_assignments"("open_course_id", "user_id");

-- CreateIndex
CREATE INDEX "learning_resource_assignments_learning_resource_id_idx" ON "learning_resource_assignments"("learning_resource_id");

-- CreateIndex
CREATE INDEX "learning_resource_assignments_user_id_idx" ON "learning_resource_assignments"("user_id");

-- CreateIndex
CREATE INDEX "learning_resource_assignments_assigned_by_id_idx" ON "learning_resource_assignments"("assigned_by_id");

-- CreateIndex
CREATE INDEX "learning_resource_assignments_deleted_at_idx" ON "learning_resource_assignments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "learning_resource_assignments_learning_resource_id_user_id_key" ON "learning_resource_assignments"("learning_resource_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "screens_key_key" ON "screens"("key");

-- CreateIndex
CREATE UNIQUE INDEX "screens_route_key" ON "screens"("route");

-- CreateIndex
CREATE INDEX "screens_section_order_idx" ON "screens"("section", "order");

-- CreateIndex
CREATE INDEX "screens_section_order_order_idx" ON "screens"("section_order", "order");

-- CreateIndex
CREATE INDEX "screens_is_active_is_sidebar_item_idx" ON "screens"("is_active", "is_sidebar_item");

-- CreateIndex
CREATE INDEX "role_screen_access_role_id_enabled_idx" ON "role_screen_access"("role_id", "enabled");

-- CreateIndex
CREATE INDEX "role_screen_access_screen_id_idx" ON "role_screen_access"("screen_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_screen_access_role_id_screen_id_key" ON "role_screen_access"("role_id", "screen_id");

-- CreateIndex
CREATE INDEX "user_screen_overrides_user_id_idx" ON "user_screen_overrides"("user_id");

-- CreateIndex
CREATE INDEX "user_screen_overrides_screen_id_idx" ON "user_screen_overrides"("screen_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_screen_overrides_user_id_screen_id_key" ON "user_screen_overrides"("user_id", "screen_id");

-- CreateIndex
CREATE INDEX "screen_access_audits_actor_id_idx" ON "screen_access_audits"("actor_id");

-- CreateIndex
CREATE INDEX "screen_access_audits_target_role_id_idx" ON "screen_access_audits"("target_role_id");

-- CreateIndex
CREATE INDEX "screen_access_audits_target_user_id_idx" ON "screen_access_audits"("target_user_id");

-- CreateIndex
CREATE INDEX "screen_access_audits_screen_id_idx" ON "screen_access_audits"("screen_id");

-- CreateIndex
CREATE INDEX "screen_access_audits_created_at_idx" ON "screen_access_audits"("created_at");

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_courses" ADD CONSTRAINT "open_courses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_course_completions" ADD CONSTRAINT "open_course_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_course_completions" ADD CONSTRAINT "open_course_completions_open_course_id_fkey" FOREIGN KEY ("open_course_id") REFERENCES "open_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_course_assignments" ADD CONSTRAINT "open_course_assignments_open_course_id_fkey" FOREIGN KEY ("open_course_id") REFERENCES "open_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_course_assignments" ADD CONSTRAINT "open_course_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_course_assignments" ADD CONSTRAINT "open_course_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resource_assignments" ADD CONSTRAINT "learning_resource_assignments_learning_resource_id_fkey" FOREIGN KEY ("learning_resource_id") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resource_assignments" ADD CONSTRAINT "learning_resource_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resource_assignments" ADD CONSTRAINT "learning_resource_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_screen_access" ADD CONSTRAINT "role_screen_access_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_screen_access" ADD CONSTRAINT "role_screen_access_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_screen_overrides" ADD CONSTRAINT "user_screen_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_screen_overrides" ADD CONSTRAINT "user_screen_overrides_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_access_audits" ADD CONSTRAINT "screen_access_audits_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_access_audits" ADD CONSTRAINT "screen_access_audits_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "screens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
