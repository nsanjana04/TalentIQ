ALTER TABLE "access_requests" ADD COLUMN IF NOT EXISTS "requester_role" TEXT;
ALTER TABLE "access_requests" ADD COLUMN IF NOT EXISTS "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "access_requests_resource_path_idx" ON "access_requests"("resource_path");
CREATE INDEX IF NOT EXISTS "access_requests_required_permission_idx" ON "access_requests"("required_permission");
CREATE INDEX IF NOT EXISTS "access_requests_requested_at_idx" ON "access_requests"("requested_at");
