/**
 * Support Ticket Types
 *
 * Types for the priority support ticket system.
 * Used by `lib/support.ts` and the Support page UI.
 */

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------

export type TicketStatus = "OPEN" | "RESOLVED" | "CLOSED";

export interface SupportTicket {
  id: string;
  title: string;
  body: string | null;
  status: TicketStatus;
  githubUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Usage (legacy — kept for backward compatibility with existing ticket list)
// ---------------------------------------------------------------------------

export interface SupportUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

// ---------------------------------------------------------------------------
// Credit pool (Phase 3 — dual pool: plan + purchased)
// Re-exported from license-types for convenience.
// ---------------------------------------------------------------------------

export type { CreditPool } from "./license-types";

// ---------------------------------------------------------------------------
// API responses
// ---------------------------------------------------------------------------

export interface TicketsResponse {
  tickets: SupportTicket[];
  usage: SupportUsage;
}

export interface CreateTicketResponse {
  ticket: SupportTicket;
  usage: SupportUsage;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface CreateTicketInput {
  title: string;
  body?: string;
}

export interface PriorityTicketInput {
  title: string;
  body?: string;
  type: "normal" | "priority";
}

// ---------------------------------------------------------------------------
// Priority ticket response (Phase 3 — deducts credit)
// ---------------------------------------------------------------------------

export interface PriorityTicketResponse {
  ticket: SupportTicket;
  creditsRemaining: number;
}

// ---------------------------------------------------------------------------
// Session booking (Phase 3)
// ---------------------------------------------------------------------------

export interface BookSessionResponse {
  bookingUrl: string;
  creditsRemaining: number;
}

// ---------------------------------------------------------------------------
// Community issues (no license required)
// ---------------------------------------------------------------------------

export interface CommunityIssueInput {
  title: string;
  body?: string;
  email: string;
  instanceId: string;
}

export interface CommunityIssueResponse {
  issueNumber: number;
  issueUrl: string;
}
