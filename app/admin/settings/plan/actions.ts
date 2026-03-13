"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { setLicenseKey } from "@/lib/config/app-settings";
import { invalidateCache, validateLicense } from "@/lib/license";
import { prisma } from "@/lib/prisma";
import type { LicenseInfo } from "@/lib/license-types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_URL = (
  process.env.PLATFORM_URL || "https://manage.artisanroast.app"
).replace(/\/+$/, "");

// ---------------------------------------------------------------------------
// License key management
// ---------------------------------------------------------------------------

const licenseKeySchema = z.object({
  key: z.string().min(1, "License key is required"),
});

interface LicenseResult {
  success: boolean;
  error?: string;
  license?: LicenseInfo;
}

/**
 * Activate a license key — saves to DB, clears cache, re-validates.
 */
export async function activateLicense(
  formData: FormData
): Promise<LicenseResult> {
  await requireAdmin();

  const parsed = licenseKeySchema.safeParse({
    key: formData.get("key"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await setLicenseKey(parsed.data.key);
    invalidateCache();
    const license = await validateLicense();
    revalidatePath("/admin/settings/plan");
    return { success: true, license };
  } catch {
    return { success: false, error: "Failed to activate license" };
  }
}

/**
 * Remove the license key — clears DB entry and cache.
 */
export async function deactivateLicense(): Promise<LicenseResult> {
  await requireAdmin();

  try {
    await setLicenseKey("");
    invalidateCache();
    const license = await validateLicense();
    revalidatePath("/admin/settings/plan");
    return { success: true, license };
  } catch {
    return { success: false, error: "Failed to deactivate license" };
  }
}

/**
 * Refresh license data from the platform without changing the key.
 */
export async function refreshLicense(): Promise<LicenseResult> {
  await requireAdmin();

  try {
    invalidateCache();
    const license = await validateLicense();
    return { success: true, license };
  } catch {
    return { success: false, error: "Failed to refresh license" };
  }
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

const checkoutSchema = z.object({
  planSlug: z.string().min(1),
});

interface CheckoutResult {
  success: boolean;
  error?: string;
  url?: string;
}

/**
 * Start a Stripe checkout session for a plan via the platform.
 */
export async function startCheckout(
  formData: FormData
): Promise<CheckoutResult> {
  await requireAdmin();

  const parsed = checkoutSchema.safeParse({
    planSlug: formData.get("planSlug"),
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid plan" };
  }

  try {
    // Get instance ID and admin email
    const instanceSetting = await prisma.siteSettings.findUnique({
      where: { key: "app.instanceId" },
    });

    const response = await fetch(`${PLATFORM_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planSlug: parsed.data.planSlug,
        instanceId: instanceSetting?.value || "",
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { success: false, error: body || "Checkout failed" };
    }

    const data = (await response.json()) as { url: string };
    return { success: true, url: data.url };
  } catch {
    return { success: false, error: "Failed to start checkout" };
  }
}
