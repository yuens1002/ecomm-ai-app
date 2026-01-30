-- CreateTable
CREATE TABLE "TelemetryEvent" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "edition" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelemetryEvent_instanceId_idx" ON "TelemetryEvent"("instanceId");

-- CreateIndex
CREATE INDEX "TelemetryEvent_event_idx" ON "TelemetryEvent"("event");

-- CreateIndex
CREATE INDEX "TelemetryEvent_createdAt_idx" ON "TelemetryEvent"("createdAt");
