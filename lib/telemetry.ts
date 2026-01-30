/**
 * Anonymous telemetry for Artisan Roast
 * Helps us understand usage and improve the product
 *
 * Opt-out: Set TELEMETRY_DISABLED=true in your environment
 */

import { APP_VERSION, EDITION } from "./version";

// All instances report to the central Artisan Roast telemetry server
// This helps us (the developers) track installs and health across all deployments
// Can be overridden if someone wants to self-host their own telemetry
const TELEMETRY_ENDPOINT =
  process.env.TELEMETRY_ENDPOINT ||
  "https://ecomm-ai-app.vercel.app/api/telemetry/events";

export interface TelemetryEvent {
  event: "install" | "heartbeat" | "upgrade";
  instanceId: string;
  version: string;
  edition: string;
  timestamp: string;
  metadata?: {
    nodeVersion?: string;
    platform?: string;
    productCount?: number;
    userCount?: number;
    orderCount?: number;
  };
}

/**
 * Check if telemetry is enabled
 */
export function isTelemetryEnabled(): boolean {
  const disabled = process.env.TELEMETRY_DISABLED?.toLowerCase();
  return disabled !== "true" && disabled !== "1" && disabled !== "yes";
}

/**
 * Send a telemetry event (fire-and-forget, never throws)
 */
export async function sendTelemetryEvent(
  event: TelemetryEvent
): Promise<boolean> {
  if (!isTelemetryEnabled()) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `ArtisanRoast/${APP_VERSION}`,
      },
      body: JSON.stringify(event),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    // Silently fail - telemetry should never impact app functionality
    return false;
  }
}

/**
 * Send install event (called once during first seed)
 */
export async function sendInstallEvent(instanceId: string): Promise<boolean> {
  return sendTelemetryEvent({
    event: "install",
    instanceId,
    version: APP_VERSION,
    edition: EDITION,
    timestamp: new Date().toISOString(),
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
}

/**
 * Send heartbeat event (called periodically via cron)
 */
export async function sendHeartbeatEvent(
  instanceId: string,
  stats: {
    productCount?: number;
    userCount?: number;
    orderCount?: number;
  }
): Promise<boolean> {
  return sendTelemetryEvent({
    event: "heartbeat",
    instanceId,
    version: APP_VERSION,
    edition: EDITION,
    timestamp: new Date().toISOString(),
    metadata: {
      ...stats,
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
}

/**
 * Get instance ID from database
 */
export async function getInstanceId(
  prisma: unknown
): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setting = await (prisma as any).siteSettings.findUnique({
      where: { key: "app.instanceId" },
    });
    return setting?.value ?? null;
  } catch {
    return null;
  }
}
