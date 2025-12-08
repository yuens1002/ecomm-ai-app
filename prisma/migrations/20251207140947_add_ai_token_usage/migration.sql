-- CreateTable
CREATE TABLE "AiTokenUsage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "style" TEXT,
    "tokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTokenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiTokenUsage_createdAt_idx" ON "AiTokenUsage"("createdAt");

-- CreateIndex
CREATE INDEX "AiTokenUsage_name_modelId_style_idx" ON "AiTokenUsage"("name", "modelId", "style");
