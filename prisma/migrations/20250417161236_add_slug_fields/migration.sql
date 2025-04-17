/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Artist` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Artist" ADD COLUMN "slug" TEXT;

-- Update existing Artist records to have slugs based on names
UPDATE "Artist" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^\w\s-]', '', 'g'), '\s+', '-', 'g'));

-- Make the column NOT NULL after populating data
ALTER TABLE "Artist" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "slug" TEXT;

-- Update existing Event records to have slugs based on titles
UPDATE "Event" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^\w\s-]', '', 'g'), '\s+', '-', 'g'));

-- Make the column NOT NULL after populating data
ALTER TABLE "Event" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
