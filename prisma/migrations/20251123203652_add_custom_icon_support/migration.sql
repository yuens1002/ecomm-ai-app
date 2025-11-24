-- AlterTable
ALTER TABLE "SocialLink" ADD COLUMN     "customIconUrl" TEXT,
ADD COLUMN     "useCustomIcon" BOOLEAN NOT NULL DEFAULT false;
