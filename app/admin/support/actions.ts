"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  listTickets,
  createTicket,
  createCommunityIssue,
  submitPriorityTicket,
  bookSession,
  getTicketDetail,
  replyToTicket,
  SupportError,
} from "@/lib/support";
import { setLicenseKey } from "@/lib/config/app-settings";
import { invalidateCache, validateLicense } from "@/lib/license";
import { getInstanceId } from "@/lib/telemetry";
import { prisma } from "@/lib/prisma";
import { acceptLegalDocs } from "@/lib/legal";
import type {
  TicketsResponse,
  CreateTicketResponse,
  CommunityIssueResponse,
  PriorityTicketResponse,
  TicketDetailResponse,
  ReplyResponse,
} from "@/lib/support-types";
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
// Priority ticket (Phase 3 — with type selector, deducts credit)
// ---------------------------------------------------------------------------

const priorityTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  steps: z.string().max(5000).optional(),
  expected: z.string().max(5000).optional(),
  type: z.enum(["normal", "priority"]),
});

interface PriorityTicketResult {
  success: boolean;
  error?: string;
  /** Machine-readable error code (e.g. "terms_acceptance_required") */
  errorCode?: string;
  data?: PriorityTicketResponse;
}

/**
 * Submit a ticket with type (normal/priority). Priority deducts a credit.
 */
export async function submitTypedTicket(
  formData: FormData
): Promise<PriorityTicketResult> {
  await requireAdmin();

  const parsed = priorityTicketSchema.safeParse({
    title: formData.get("title"),
    steps: formData.get("steps") || undefined,
    expected: formData.get("expected") || undefined,
    type: formData.get("type") || "normal",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Compose body from structured fields
  const bodyParts: string[] = [];
  if (parsed.data.steps) bodyParts.push(`**Steps to reproduce:**\n${parsed.data.steps}`);
  if (parsed.data.expected) bodyParts.push(`**Expected / actual:**\n${parsed.data.expected}`);
  const body = bodyParts.length > 0 ? bodyParts.join("\n\n") : undefined;

  try {
    const data = await submitPriorityTicket({
      title: parsed.data.title,
      body,
      type: parsed.data.type,
    });
    return { success: true, data };
  } catch (error) {
    if (error instanceof SupportError) {
      return { success: false, error: error.message, errorCode: error.code };
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
      termsAccepted: true,
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
// Legal acceptance (Phase 3)
// ---------------------------------------------------------------------------

const legalAcceptSchema = z.object({
  documents: z.array(
    z.object({
      slug: z.string().min(1),
      version: z.string().min(1),
    })
  ),
});

/**
 * Accept legal documents (e.g., support-terms).
 * Sends acceptance to the platform and refreshes the license.
 */
export async function acceptTerms(
  documents: Array<{ slug: string; version: string }>
): Promise<{ success: boolean; error?: string; license?: LicenseInfo }> {
  await requireAdmin();

  const parsed = legalAcceptSchema.safeParse({ documents });
  if (!parsed.success) {
    return { success: false, error: "Invalid document data" };
  }

  const result = await acceptLegalDocs(parsed.data.documents);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Refresh license to get updated legal state
  invalidateCache();
  const license = await validateLicense();
  revalidatePath("/admin/support");
  return { success: true, license };
}

// ---------------------------------------------------------------------------
// Session booking (Phase 3)
// ---------------------------------------------------------------------------

/**
 * Book a 1:1 support session. Deducts a session credit.
 */
export async function bookSupportSession(): Promise<{
  success: boolean;
  error?: string;
  errorCode?: string;
  data?: { bookingUrl: string };
}> {
  await requireAdmin();

  try {
    const result = await bookSession();
    return { success: true, data: { bookingUrl: result.bookingUrl } };
  } catch (error) {
    if (error instanceof SupportError) {
      return { success: false, error: error.message, errorCode: error.code };
    }
    return { success: false, error: "Failed to book session" };
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

// ---------------------------------------------------------------------------
// Ticket detail + messaging (Phase 5)
// ---------------------------------------------------------------------------

/**
 * Fetch a single ticket with its message thread.
 */
export async function fetchTicketDetail(
  id: string
): Promise<{ success: boolean; error?: string; data?: TicketDetailResponse }> {
  await requireAdmin();

  try {
    const data = await getTicketDetail(id);
    return { success: true, data };
  } catch (error) {
    if (error instanceof SupportError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to fetch ticket" };
  }
}

const replySchema = z.object({
  body: z.string().min(1, "Reply cannot be empty").max(10_000),
});

/**
 * Reply to a support ticket.
 */
export async function submitTicketReply(
  ticketId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; errorCode?: string; data?: ReplyResponse }> {
  await requireAdmin();

  const parsed = replySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const data = await replyToTicket(ticketId, parsed.data.body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof SupportError) {
      return { success: false, error: error.message, errorCode: error.code };
    }
    return { success: false, error: "Failed to send reply" };
  }
}
