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
  PriorityTicketInput,
  PriorityTicketResponse,
  BookSessionResponse,
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
    public status: number,
    /** Machine-readable error code from the platform (e.g. "terms_acceptance_required") */
    public code?: string
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
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(body);
    } catch {
      // Not JSON — fall through to default handling
    }

    switch (response.status) {
      case 401:
        throw new SupportError("Invalid license key", 401);
      case 402:
        throw new SupportError(
          "No credits remaining",
          402,
          "credits_exhausted"
        );
      case 403: {
        const code = typeof parsed?.error === "string" ? parsed.error : undefined;
        if (code === "terms_acceptance_required") {
          throw new SupportError(
            "Please review and accept the updated terms before continuing.",
            403,
            "terms_acceptance_required"
          );
        }
        throw new SupportError(
          "Priority support is not included in your plan",
          403
        );
      }
      case 429:
        throw new SupportError(
          "Ticket limit reached for this billing cycle",
          429
        );
      default:
        throw new SupportError(
          (typeof parsed?.message === "string" ? parsed.message : body) ||
            `Platform error (${response.status})`,
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
  if (process.env.MOCK_LICENSE_TIER) return MOCK_TICKETS_RESPONSE;
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

/**
 * Submit a priority ticket with type (normal/priority).
 * Phase 3: Deducts a credit from the user's pool.
 */
export async function submitPriorityTicket(
  input: PriorityTicketInput
): Promise<PriorityTicketResponse> {
  if (process.env.MOCK_LICENSE_TIER) {
    return {
      ticket: {
        id: `t-${Date.now()}`,
        title: input.title,
        body: input.body ?? null,
        type: input.type,
        status: "OPEN",
        githubUrl: input.type === "normal"
          ? `https://github.com/artisanroast/artisan-roast/issues/${Math.floor(Math.random() * 100) + 50}`
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      creditsRemaining: input.type === "priority" ? 4 : 5,
    };
  }
  return supportFetch<PriorityTicketResponse>("/api/support/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Book a 1:1 support session.
 * Phase 3: Deducts a session credit, returns a booking URL.
 */
export async function bookSession(): Promise<BookSessionResponse> {
  if (process.env.MOCK_LICENSE_TIER) {
    return {
      bookingUrl: "https://cal.com/mock-session",
      creditsRemaining: 0,
    };
  }
  return supportFetch<BookSessionResponse>("/api/support/sessions", {
    method: "POST",
    body: JSON.stringify({}),
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

// ---------------------------------------------------------------------------
// Mock data (for MOCK_LICENSE_TIER env var)
// ---------------------------------------------------------------------------

const MOCK_TICKETS: import("./support-types").SupportTicket[] = (() => {
  const base = "2026-03-16T12:00:00Z";
  const offset = (ms: number) =>
    new Date(new Date(base).getTime() - ms).toISOString();
  return [
    { id: "t1", title: "Menu items not syncing after bulk import", body: null, type: "priority", status: "OPEN", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/42", createdAt: offset(2 * 3600_000), updatedAt: offset(2 * 3600_000) },
    { id: "t2", title: "Order confirmation email missing store logo", body: null, type: "normal", status: "OPEN", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/41", createdAt: offset(8 * 3600_000), updatedAt: offset(8 * 3600_000) },
    { id: "t3", title: "Stripe webhook fails on subscription renewal", body: null, type: "priority", status: "RESOLVED", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/38", createdAt: offset(3 * 86400_000), updatedAt: offset(1 * 86400_000) },
    { id: "t4", title: "Product images 404 after domain change", body: null, type: "normal", status: "RESOLVED", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/37", createdAt: offset(7 * 86400_000), updatedAt: offset(5 * 86400_000) },
    { id: "t5", title: "Dashboard analytics not loading on Safari", body: null, type: "normal", status: "CLOSED", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/35", createdAt: offset(14 * 86400_000), updatedAt: offset(10 * 86400_000) },
  ];
})();

const MOCK_TICKETS_RESPONSE: TicketsResponse = {
  tickets: MOCK_TICKETS,
  usage: { used: 1, limit: 5, remaining: 4, resetsAt: "2026-04-01T00:00:00Z" },
};
