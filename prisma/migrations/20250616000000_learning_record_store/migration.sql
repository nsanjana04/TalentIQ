-- Learning Record Store (LRS) — xAPI event model + progress tracking

CREATE TYPE "XapiVerb" AS ENUM ('STARTED', 'PAUSED', 'RESUMED', 'COMPLETED', 'PASSED', 'FAILED', 'VIEWED', 'DOWNLOADED', 'CERTIFIED');
CREATE TYPE "LearningEventSource" AS ENUM ('INTERNAL', 'SCORM', 'XAPI', 'EXTERNAL');
CREATE TYPE "ExternalLearningProvider" AS ENUM ('LINKEDIN_LEARNING', 'COURSERA', 'UDEMY_BUSINESS', 'PLURALSIGHT', 'SKILLSOFT');
CREATE TYPE "CertificateProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'EARNED', 'EXPIRED');

CREATE TABLE "learning_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "verb" "XapiVerb" NOT NULL,
    "actor" JSONB NOT NULL,
    "object" JSONB NOT NULL,
    "result" JSONB,
    "context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "course_id" TEXT,
    "module_id" TEXT,
    "lesson_id" TEXT,
    "assessment_id" TEXT,
    "certificate_id" TEXT,
    "duration_ms" INTEGER,
    "raw_statement" JSONB,
    "source" "LearningEventSource" NOT NULL DEFAULT 'INTERNAL',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "total_lessons" INTEGER NOT NULL DEFAULT 0,
    "completed_lessons" INTEGER NOT NULL DEFAULT 0,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "time_spent_minutes" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3),
    "estimated_completion_at" TIMESTAMP(3),
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assessment_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "total_questions" INTEGER NOT NULL DEFAULT 0,
    "completed_questions" INTEGER NOT NULL DEFAULT 0,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_id" TEXT,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "best_score" INTEGER,
    "passed" BOOLEAN,
    "last_activity_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "certificate_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "template_id" TEXT,
    "course_id" TEXT,
    "assessment_id" TEXT,
    "certificate_id" TEXT,
    "status" "CertificateProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "earned_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "external_learning_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "ExternalLearningProvider" NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "time_spent_minutes" INTEGER NOT NULL DEFAULT 0,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "completed_at" TIMESTAMP(3),
    "raw_payload" JSONB,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_learning_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_progress_user_id_course_id_key" ON "course_progress"("user_id", "course_id");
CREATE UNIQUE INDEX "assessment_progress_user_id_assessment_id_key" ON "assessment_progress"("user_id", "assessment_id");
CREATE UNIQUE INDEX "external_learning_records_user_id_provider_external_id_key" ON "external_learning_records"("user_id", "provider", "external_id");
CREATE UNIQUE INDEX "course_progress_enrollment_id_key" ON "course_progress"("enrollment_id");

CREATE INDEX "learning_events_user_id_idx" ON "learning_events"("user_id");
CREATE INDEX "learning_events_verb_idx" ON "learning_events"("verb");
CREATE INDEX "learning_events_course_id_idx" ON "learning_events"("course_id");
CREATE INDEX "learning_events_module_id_idx" ON "learning_events"("module_id");
CREATE INDEX "learning_events_lesson_id_idx" ON "learning_events"("lesson_id");
CREATE INDEX "learning_events_assessment_id_idx" ON "learning_events"("assessment_id");
CREATE INDEX "learning_events_timestamp_idx" ON "learning_events"("timestamp");
CREATE INDEX "learning_events_source_idx" ON "learning_events"("source");
CREATE INDEX "learning_events_deleted_at_idx" ON "learning_events"("deleted_at");

CREATE INDEX "course_progress_user_id_idx" ON "course_progress"("user_id");
CREATE INDEX "course_progress_course_id_idx" ON "course_progress"("course_id");
CREATE INDEX "course_progress_status_idx" ON "course_progress"("status");
CREATE INDEX "course_progress_last_activity_at_idx" ON "course_progress"("last_activity_at");
CREATE INDEX "course_progress_deleted_at_idx" ON "course_progress"("deleted_at");

CREATE INDEX "assessment_progress_user_id_idx" ON "assessment_progress"("user_id");
CREATE INDEX "assessment_progress_assessment_id_idx" ON "assessment_progress"("assessment_id");
CREATE INDEX "assessment_progress_status_idx" ON "assessment_progress"("status");
CREATE INDEX "assessment_progress_deleted_at_idx" ON "assessment_progress"("deleted_at");

CREATE INDEX "certificate_progress_user_id_idx" ON "certificate_progress"("user_id");
CREATE INDEX "certificate_progress_course_id_idx" ON "certificate_progress"("course_id");
CREATE INDEX "certificate_progress_assessment_id_idx" ON "certificate_progress"("assessment_id");
CREATE INDEX "certificate_progress_status_idx" ON "certificate_progress"("status");
CREATE INDEX "certificate_progress_expires_at_idx" ON "certificate_progress"("expires_at");
CREATE INDEX "certificate_progress_deleted_at_idx" ON "certificate_progress"("deleted_at");

CREATE INDEX "external_learning_records_user_id_idx" ON "external_learning_records"("user_id");
CREATE INDEX "external_learning_records_provider_idx" ON "external_learning_records"("provider");
CREATE INDEX "external_learning_records_status_idx" ON "external_learning_records"("status");
CREATE INDEX "external_learning_records_synced_at_idx" ON "external_learning_records"("synced_at");
CREATE INDEX "external_learning_records_deleted_at_idx" ON "external_learning_records"("deleted_at");

ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assessment_progress" ADD CONSTRAINT "assessment_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assessment_progress" ADD CONSTRAINT "assessment_progress_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "certificate_progress" ADD CONSTRAINT "certificate_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "certificate_progress" ADD CONSTRAINT "certificate_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "certificate_progress" ADD CONSTRAINT "certificate_progress_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "certificate_progress" ADD CONSTRAINT "certificate_progress_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "external_learning_records" ADD CONSTRAINT "external_learning_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
