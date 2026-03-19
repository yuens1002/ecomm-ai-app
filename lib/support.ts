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
  TicketDetailResponse,
  ReplyResponse,
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
      case 409:
        throw new SupportError(
          "Ticket is not open",
          409,
          "ticket_not_open"
        );
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
  return supportFetch<BookSessionResponse>("/api/support/sessions", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

// ---------------------------------------------------------------------------
// Ticket detail + messaging (Phase 5)
// ---------------------------------------------------------------------------

/** Fetch a single ticket with its reply thread. */
export async function getTicketDetail(
  id: string
): Promise<TicketDetailResponse> {
  if (process.env.MOCK_LICENSE_TIER) {
    const ticket = MOCK_TICKETS.find((t) => t.id === id);
    if (!ticket) throw new SupportError("Ticket not found", 404);
    return { ticket, replies: MOCK_REPLIES[id] ?? [] };
  }
  // GET /api/support/tickets/{id} returns ticket; replies come from a separate call
  const [ticket, repliesData] = await Promise.all([
    supportFetch<{ ticket: import("./support-types").SupportTicket }>(`/api/support/tickets/${id}`),
    supportFetch<{ replies: import("./support-types").TicketReply[] }>(`/api/support/tickets/${id}/replies`),
  ]);
  return { ticket: ticket.ticket, replies: repliesData.replies };
}

/** Reply to a ticket. Returns the created reply (flat object per contract). */
export async function replyToTicket(
  id: string,
  body: string
): Promise<ReplyResponse> {
  return supportFetch<ReplyResponse>(`/api/support/tickets/${id}/replies`, {
    method: "POST",
    body: JSON.stringify({ body }),
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
      case 429:
        throw new SupportError(
          "You've submitted too many issues. Please try again in an hour.",
          429
        );
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
// Mock data (for MOCK_LICENSE_TIER env var — dev only)
// ---------------------------------------------------------------------------

const MOCK_TICKETS: import("./support-types").SupportTicket[] = [
  {
    id: "mock-ticket-001",
    title: "Products not loading after deployment",
    body: "After deploying to Vercel, the product listing page returns a 500 error. The error log shows a Prisma connection timeout. I've checked the DATABASE_URL env var and it looks correct.",
    type: "priority",
    status: "OPEN",
    githubUrl: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-ticket-002",
    title: "How do I configure Stripe webhooks?",
    body: "I'm setting up Stripe for the first time and I'm not sure which webhook events to subscribe to. The docs mention order fulfillment — does that require a specific event?",
    type: "normal",
    status: "RESOLVED",
    githubUrl: "https://github.com/artisan-roast/artisan-roast/issues/42",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_TICKETS_RESPONSE: TicketsResponse = {
  tickets: MOCK_TICKETS,
  usage: { used: 2, limit: 6, remaining: 4, resetsAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() },
};

const MOCK_REPLIES: Record<string, import("./support-types").TicketReply[]> = {
  "mock-ticket-001": [
    {
      id: "reply-001-a",
      ticketId: "mock-ticket-001",
      body: "Thanks for the report. Can you share the full Prisma error from the Vercel function logs? Also, is this a new deployment or did it regress after a schema change?",
      source: "SUPPORT",
      createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "reply-001-b",
      ticketId: "mock-ticket-001",
      body: "Here's the error: `PrismaClientInitializationError: Can't reach database server`. I did run a migration right before deploying — could that be it? I didn't backup first.",
      source: "CUSTOMER",
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "reply-001-c",
      ticketId: "mock-ticket-001",
      body: "That's the likely cause. Neon databases can enter an idle state mid-migration if the connection limit is hit. Try adding `connection_limit=1` to your DATABASE_URL for migrations, then redeploy.",
      source: "SUPPORT",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "mock-ticket-002": [
    {
      id: "reply-002-a",
      ticketId: "mock-ticket-002",
      body: "For order fulfillment you'll need: `checkout.session.completed`, `payment_intent.succeeded`, and `payment_intent.payment_failed`. The setup guide in `docs/stripe-setup.md` has the full list with explanations.",
      source: "SUPPORT",
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};
