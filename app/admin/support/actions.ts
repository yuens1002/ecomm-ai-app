"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { listTickets, createTicket, createCommunityIssue, SupportError } from "@/lib/support";
import { setLicenseKey } from "@/lib/config/app-settings";
import { invalidateCache, validateLicense } from "@/lib/license";
import { getInstanceId } from "@/lib/telemetry";
import { prisma } from "@/lib/prisma";
import type { TicketsResponse, CreateTicketResponse, CommunityIssueResponse } from "@/lib/support-types";
import type { LicenseInfo } from "@/lib/license-types";

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------

const ticketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().max(5000).optional(),
});

interface TicketResult {
  success: boolean;
  error?: string;
  data?: CreateTicketResponse;
}

/**
 * Submit a new support ticket to the platform.
 */
export async function submitSupportTicket(
  formData: FormData
): Promise<TicketResult> {
  await requireAdmin();

  const parsed = ticketSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const data = await createTicket(parsed.data);
    return { success: true, data };
  } catch (error) {
    if (error instanceof SupportError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create ticket" };
  }
}

// ---------------------------------------------------------------------------
// Community issues
// ---------------------------------------------------------------------------

const communityIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().max(5000).optional(),
});

interface CommunityIssueResult {
  success: boolean;
  error?: string;
  data?: CommunityIssueResponse;
}

/**
 * Submit a community issue to GitHub via the platform.
 * Fetches contactEmail from siteSettings and instanceId automatically.
 */
export async function submitCommunityIssue(
  formData: FormData
): Promise<CommunityIssueResult> {
  await requireAdmin();

  const parsed = communityIssueSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Fetch contactEmail from siteSettings
  const contactSetting = await prisma.siteSettings.findUnique({
    where: { key: "contactEmail" },
  });
  const contactEmail = contactSetting?.value;
  if (!contactEmail) {
    return {
      success: false,
      error: "Configure contact email in Settings > Contact",
    };
  }

  // Fetch instanceId
  const instanceId = await getInstanceId(prisma);

  try {
    const data = await createCommunityIssue({
      ...parsed.data,
      email: contactEmail,
      instanceId: instanceId || "",
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof SupportError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create issue" };
  }
}

/**
 * Fetch support tickets and usage from the platform.
 */
export async function fetchSupportTickets(): Promise<{
  success: boolean;
  error?: string;
  data?: TicketsResponse;
}> {
  await requireAdmin();

  try {
    const data = await listTickets();
    return { success: true, data };
  } catch (error) {
    if (error instanceof SupportError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch tickets" };
  }
}

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
    revalidatePath("/admin/support");
    return { success: true, license };
  } catch {
    return { success: false, error: "Failed to activate license" };
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
