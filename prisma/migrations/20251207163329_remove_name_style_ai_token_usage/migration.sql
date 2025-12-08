/*
  Warnings:

  - You are about to drop the column `name` on the `AiTokenUsage` table. All the data in the column will be lost.
  - You are about to drop the column `style` on the `AiTokenUsage` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX IF EXISTS "AiTokenUsage_name_modelId_style_idx";

-- AlterTable
ALTER TABLE "AiTokenUsage" DROP COLUMN "name",
DROP COLUMN "style";

-- CreateIndex
CREATE INDEX "AiTokenUsage_modelId_provider_createdAt_idx" ON "AiTokenUsage"("modelId", "provider", "createdAt");
