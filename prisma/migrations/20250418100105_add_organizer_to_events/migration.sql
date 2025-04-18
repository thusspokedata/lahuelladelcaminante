/*
  Warnings:

  - Added the required column `organizer` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN "organizer" TEXT;

-- Update existing events to have a default organizer
UPDATE "Event" SET "organizer" = 'La Huella del Caminante';

-- Make the column required after filling it
ALTER TABLE "Event" ALTER COLUMN "organizer" SET NOT NULL;
