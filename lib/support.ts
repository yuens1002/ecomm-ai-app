/**
 * Support Module — Server-only platform client for priority support tickets.
 *
 * Calls the platform API to create and list support tickets.
 * Requires a valid license key with the `priority-support` feature.
 */

import { getLicenseKey } from "./license";
import type {
  TicketsResponse,
  CreateTicketResponse,
  CreateTicketInput,
  CommunityIssueInput,
  CommunityIssueResponse,
} from "./support-types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORM_URL = (
  process.env.PLATFORM_URL || "https://manage.artisanroast.app"
).replace(/\/+$/, "");

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class SupportError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "SupportError";
  }
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function supportFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const key = await getLicenseKey();
  if (!key) {
    throw new SupportError("No license key configured", 401);
  }

  const response = await fetch(`${PLATFORM_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...init?.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    switch (response.status) {
      case 401:
        throw new SupportError("Invalid license key", 401);
      case 403:
        throw new SupportError(
          "Priority support is not included in your plan",
          403
        );
      case 429:
        throw new SupportError(
          "Ticket limit reached for this billing cycle",
          429
        );
      default:
        throw new SupportError(
          body || `Platform error (${response.status})`,
          response.status
        );
    }
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** List support tickets and usage for the current license. */
export async function listTickets(): Promise<TicketsResponse> {
  return supportFetch<TicketsResponse>("/api/support/tickets");
}

/** Create a new support ticket. */
export async function createTicket(
  input: CreateTicketInput
): Promise<CreateTicketResponse> {
  return supportFetch<CreateTicketResponse>("/api/support/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Community issues (no license required)
// ---------------------------------------------------------------------------

/** Create a community issue on GitHub via the platform. No auth required. */
export async function createCommunityIssue(
  input: CommunityIssueInput
): Promise<CommunityIssueResponse> {
  const response = await fetch(`${PLATFORM_URL}/api/support/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    switch (response.status) {
      case 400:
        throw new SupportError(body || "Missing required fields", 400);
      case 502:
        throw new SupportError("GitHub API unavailable", 502);
      case 503:
        throw new SupportError("GitHub integration not configured", 503);
      default:
        throw new SupportError(
          body || `Platform error (${response.status})`,
          response.status
        );
    }
  }

  return response.json() as Promise<CommunityIssueResponse>;
}
