-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_artistId_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "artistId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
