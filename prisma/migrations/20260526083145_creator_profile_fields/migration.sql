-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "city" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "socialMedia" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_slug_key" ON "UserProfile"("slug");
