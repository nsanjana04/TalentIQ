-- Access requests + extended audit actions

CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED');

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'COPILOT_QUERY';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ACCESS_REQUEST';

CREATE TABLE "access_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "resource_path" TEXT NOT NULL,
    "required_permission" TEXT NOT NULL,
    "reason" TEXT,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_requests_user_id_idx" ON "access_requests"("user_id");
CREATE INDEX "access_requests_status_idx" ON "access_requests"("status");
CREATE INDEX "access_requests_created_at_idx" ON "access_requests"("created_at");
CREATE INDEX "access_requests_deleted_at_idx" ON "access_requests"("deleted_at");

ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
