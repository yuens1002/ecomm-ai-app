-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "headerOrder" INTEGER,
ADD COLUMN     "showInHeader" BOOLEAN NOT NULL DEFAULT false;
