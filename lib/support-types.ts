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
// Usage
// ---------------------------------------------------------------------------

export interface SupportUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

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

// ---------------------------------------------------------------------------
// Community issues (no license required)
// ---------------------------------------------------------------------------

export interface CommunityIssueInput {
  title: string;
  body?: string;
  email: string;
}

export interface CommunityIssueResponse {
  issueNumber: number;
  issueUrl: string;
}
