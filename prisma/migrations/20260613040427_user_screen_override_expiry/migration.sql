-- AlterTable
ALTER TABLE "user_screen_overrides" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "user_screen_overrides_expires_at_idx" ON "user_screen_overrides"("expires_at");

-- AddForeignKey
ALTER TABLE "user_screen_overrides" ADD CONSTRAINT "user_screen_overrides_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
