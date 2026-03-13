"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { listTickets, createTicket, createCommunityIssue, SupportError } from "@/lib/support";
import type { TicketsResponse, CreateTicketResponse, CommunityIssueResponse } from "@/lib/support-types";

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
  email: z.string().email("Valid email is required"),
  body: z.string().max(5000).optional(),
});

interface CommunityIssueResult {
  success: boolean;
  error?: string;
  data?: CommunityIssueResponse;
}

/**
 * Submit a community issue to GitHub via the platform.
 */
export async function submitCommunityIssue(
  formData: FormData
): Promise<CommunityIssueResult> {
  await requireAdmin();

  const parsed = communityIssueSchema.safeParse({
    title: formData.get("title"),
    email: formData.get("email"),
    body: formData.get("body") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const data = await createCommunityIssue(parsed.data);
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
