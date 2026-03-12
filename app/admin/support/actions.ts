"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { setLicenseKey } from "@/lib/config/app-settings";
import { validateLicense, invalidateCache } from "@/lib/license";
import type { LicenseInfo } from "@/lib/license-types";

const activateSchema = z.object({
  key: z.string().min(1, "License key is required"),
});

interface ActivateResult {
  success: boolean;
  error?: string;
  license?: LicenseInfo;
}

/**
 * Activate a license key — saves to DB, invalidates cache, re-validates.
 */
export async function activateLicense(
  formData: FormData
): Promise<ActivateResult> {
  await requireAdmin();

  const parsed = activateSchema.safeParse({ key: formData.get("key") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { key } = parsed.data;

  // Save key to DB
  await setLicenseKey(key);

  // Clear cached license so next validate hits the platform
  invalidateCache();

  // Re-validate with new key
  const license = await validateLicense();

  if (license.tier === "FREE") {
    // Key was rejected by platform (or platform unreachable)
    return {
      success: false,
      error:
        "Could not validate this key. Check the key and try again.",
      license,
    };
  }

  return { success: true, license };
}

/**
 * Remove the current license key and revert to FREE tier.
 */
export async function deactivateLicense(): Promise<ActivateResult> {
  await requireAdmin();

  await setLicenseKey("");
  invalidateCache();

  const license = await validateLicense();
  return { success: true, license };
}

/**
 * Force re-validate the license (clears cache).
 */
export async function refreshLicense(): Promise<LicenseInfo> {
  await requireAdmin();
  invalidateCache();
  return validateLicense();
}
