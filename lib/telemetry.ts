/**
 * Anonymous telemetry for Artisan Roast
 * Helps us understand usage and improve the product
 *
 * Opt-out options:
 * 1. Admin UI: Support > Data Privacy > toggle off
 * 2. Environment: Set TELEMETRY_DISABLED=true
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
 * Check if telemetry is disabled via environment variable
 */
export function isTelemetryDisabledByEnv(): boolean {
  const disabled = process.env.TELEMETRY_DISABLED?.toLowerCase();
  return disabled === "true" || disabled === "1" || disabled === "yes";
}

/**
 * Check if telemetry is enabled (checks both env var and database setting)
 * @param prisma - Prisma client instance to check database setting
 */
export async function isTelemetryEnabled(
  prisma?: unknown
): Promise<boolean> {
  // Environment variable takes precedence
  if (isTelemetryDisabledByEnv()) {
    return false;
  }

  // Check database setting if prisma is provided
  if (prisma) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setting = await (prisma as any).siteSettings.findUnique({
        where: { key: "telemetry_enabled" },
      });
      // Default to enabled if not set
      if (setting?.value === "false") {
        return false;
      }
    } catch {
      // If database check fails, continue with telemetry enabled
    }
  }

  return true;
}

/**
 * Send a telemetry event (fire-and-forget, never throws)
 * @param event - The telemetry event to send
 * @param prisma - Optional Prisma client to check database setting
 */
export async function sendTelemetryEvent(
  event: TelemetryEvent,
  prisma?: unknown
): Promise<boolean> {
  const enabled = await isTelemetryEnabled(prisma);
  if (!enabled) {
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
 * @param instanceId - The unique instance ID
 * @param prisma - Optional Prisma client to check database setting
 */
export async function sendInstallEvent(
  instanceId: string,
  prisma?: unknown
): Promise<boolean> {
  return sendTelemetryEvent(
    {
      event: "install",
      instanceId,
      version: APP_VERSION,
      edition: EDITION,
      timestamp: new Date().toISOString(),
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
      },
    },
    prisma
  );
}

/**
 * Send heartbeat event (called periodically via cron)
 * @param instanceId - The unique instance ID
 * @param stats - Aggregate statistics
 * @param prisma - Optional Prisma client to check database setting
 */
export async function sendHeartbeatEvent(
  instanceId: string,
  stats: {
    productCount?: number;
    userCount?: number;
    orderCount?: number;
  },
  prisma?: unknown
): Promise<boolean> {
  return sendTelemetryEvent(
    {
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
    },
    prisma
  );
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
