import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * POST /api/telemetry/events
 * Receives anonymous telemetry events from Artisan Roast instances
 *
 * This is a public endpoint - no authentication required
 * Events are validated and stored for aggregate analysis
 */

const telemetryEventSchema = z.object({
  event: z.enum(["install", "heartbeat", "upgrade"]),
  instanceId: z.string().min(1),
  version: z.string().min(1),
  edition: z.string().min(1),
  timestamp: z.string().optional(),
  metadata: z
    .object({
      nodeVersion: z.string().optional(),
      platform: z.string().optional(),
      productCount: z.number().optional(),
      userCount: z.number().optional(),
      orderCount: z.number().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = telemetryEventSchema.parse(body);

    // Store the event
    await prisma.telemetryEvent.create({
      data: {
        event: validated.event,
        instanceId: validated.instanceId,
        version: validated.version,
        edition: validated.edition,
        metadata: validated.metadata ?? undefined,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid event data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Telemetry event error:", error);
    return NextResponse.json(
      { error: "Failed to record event" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telemetry/events
 * Returns aggregate telemetry stats (admin only in future)
 * For now, just returns basic counts
 */
export async function GET() {
  try {
    const [totalInstalls, activeInstances, versionCounts] = await Promise.all([
      prisma.telemetryEvent.count({ where: { event: "install" } }),
      prisma.telemetryEvent.groupBy({
        by: ["instanceId"],
        where: {
          event: "heartbeat",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.telemetryEvent.groupBy({
        by: ["version"],
        _count: { version: true },
        where: { event: "heartbeat" },
        orderBy: { _count: { version: "desc" } },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      totalInstalls,
      activeInstancesLast30Days: activeInstances.length,
      topVersions: versionCounts.map((v: { version: string; _count: { version: number } }) => ({
        version: v.version,
        count: v._count.version,
      })),
    });
  } catch (error) {
    console.error("Telemetry stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
