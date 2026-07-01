-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'RENEWED');

-- AlterTable
ALTER TABLE "certificate_templates" ADD COLUMN "issuer_name" TEXT;
ALTER TABLE "certificate_templates" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "certificates" ADD COLUMN "verification_token" TEXT;
ALTER TABLE "certificates" ADD COLUMN "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "certificates" ADD COLUMN "issued_by_id" TEXT;
ALTER TABLE "certificates" ADD COLUMN "renewed_from_id" TEXT;
ALTER TABLE "certificates" ADD COLUMN "renewed_at" TIMESTAMP(3);
ALTER TABLE "certificates" ADD COLUMN "revoked_at" TIMESTAMP(3);
ALTER TABLE "certificates" ADD COLUMN "revoked_reason" TEXT;

-- Backfill verification tokens
UPDATE "certificates" SET "verification_token" = gen_random_uuid()::text WHERE "verification_token" IS NULL;
ALTER TABLE "certificates" ALTER COLUMN "verification_token" SET NOT NULL;

-- Expire past-due certificates
UPDATE "certificates" SET "status" = 'EXPIRED' WHERE "expires_at" < NOW() AND "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verification_token_key" ON "certificates"("verification_token");
CREATE INDEX "certificates_verification_token_idx" ON "certificates"("verification_token");
CREATE INDEX "certificates_status_idx" ON "certificates"("status");
CREATE INDEX "certificate_templates_is_active_idx" ON "certificate_templates"("is_active");

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_renewed_from_id_fkey" FOREIGN KEY ("renewed_from_id") REFERENCES "certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
