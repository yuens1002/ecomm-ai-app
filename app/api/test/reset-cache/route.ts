/**
 * Test-only route: clears the in-memory license/plans cache and removes
 * the license key from DB so tests start from a clean FREE state.
 *
 * Only available when NEXT_PUBLIC_DEMO_MODE=true.
 */

import { NextResponse } from "next/server";
import { forceFreeTierForTest } from "@/lib/license";
import { invalidatePlansCache } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }
  forceFreeTierForTest();
  invalidatePlansCache();
  // Also remove the license key from DB so getLicenseKey() returns ""
  // and validateLicense() returns FREE without calling the platform API.
  try {
    await prisma.siteSettings.deleteMany({ where: { key: "license.key" } });
  } catch {
    // Non-fatal — cache is already cleared
  }
  return NextResponse.json({ ok: true });
}
