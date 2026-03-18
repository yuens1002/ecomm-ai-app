import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { setLicenseKey } from "@/lib/config/app-settings";
import { invalidateCache } from "@/lib/license";
import { getInstanceId } from "@/lib/telemetry";
import { prisma } from "@/lib/prisma";

const activateSchema = z.object({
  licenseKey: z.string().min(1),
  email: z.string().email(),
  instanceId: z.string().min(1),
});

/**
 * POST /api/admin/platform/activate
 *
 * Receives { licenseKey, email, instanceId? } from the platform webhook
 * after a successful Stripe checkout. Saves the key and invalidates cache.
 *
 * Security: Verified by instanceId match (platform must know the store's ID).
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = activateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Verify instanceId against local store ID
    const localInstanceId = await getInstanceId(prisma);
    if (localInstanceId && parsed.data.instanceId !== localInstanceId) {
      return NextResponse.json(
        { error: "Instance ID mismatch" },
        { status: 403 }
      );
    }

    await setLicenseKey(parsed.data.licenseKey);
    invalidateCache();
    revalidatePath("/admin/support");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Activation failed" },
      { status: 500 }
    );
  }
}
