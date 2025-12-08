-- AlterTable
ALTER TABLE "AiTokenUsage" ADD COLUMN     "actorType" TEXT,
ADD COLUMN     "completionTokens" INTEGER,
ADD COLUMN     "feature" TEXT,
ADD COLUMN     "latencyMs" INTEGER,
ADD COLUMN     "pageId" TEXT,
ADD COLUMN     "promptTokens" INTEGER,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "route" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "totalTokens" INTEGER;

-- CreateIndex
CREATE INDEX "AiTokenUsage_feature_createdAt_idx" ON "AiTokenUsage"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiTokenUsage_provider_modelId_createdAt_idx" ON "AiTokenUsage"("provider", "modelId", "createdAt");
