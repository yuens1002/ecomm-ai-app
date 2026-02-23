import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin";
import { getCarrierClient } from "@/lib/services/carriers";

const testSchema = z.object({
  carrier: z.string(),
  apiKeys: z.record(z.string(), z.string()),
});

/**
 * POST /api/admin/settings/carriers/test
 * Test carrier API credentials by calling testConnection()
 */
export async function POST(request: NextRequest) {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const { carrier, apiKeys } = testSchema.parse(body);

    const client = getCarrierClient(carrier, apiKeys);
    if (!client) {
      return NextResponse.json(
        { success: false, message: `No client available for carrier "${carrier}". Check that API keys are provided.` },
        { status: 200 }
      );
    }

    const result = await client.testConnection();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }
    console.error("Carrier test error:", err);
    return NextResponse.json(
      { success: false, message: "Connection test failed" },
      { status: 500 }
    );
  }
}
