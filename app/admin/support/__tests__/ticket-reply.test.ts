/**
 * Tests for fetchTicketDetail and submitTicketReply server actions
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireAdmin = jest.fn().mockResolvedValue(undefined);
const mockGetTicketDetail = jest.fn();
const mockReplyToTicket = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

jest.mock("@/lib/support", () => ({
  SupportError: class SupportError extends Error {
    status: number;
    code?: string;
    constructor(message: string, status: number, code?: string) {
      super(message);
      this.name = "SupportError";
      this.status = status;
      this.code = code;
    }
  },
  getTicketDetail: (...args: unknown[]) => mockGetTicketDetail(...args),
  replyToTicket: (...args: unknown[]) => mockReplyToTicket(...args),
  // Stub unused exports to avoid module resolution errors
  listTickets: jest.fn(),
  createTicket: jest.fn(),
  submitPriorityTicket: jest.fn(),
  bookSession: jest.fn(),
  createCommunityIssue: jest.fn(),
}));

jest.mock("@/lib/config/app-settings", () => ({
  setLicenseKey: jest.fn(),
}));

jest.mock("@/lib/license", () => ({
  invalidateCache: jest.fn(),
  validateLicense: jest.fn().mockResolvedValue({ tier: "FREE", features: [] }),
}));

jest.mock("@/lib/telemetry", () => ({
  getInstanceId: jest.fn().mockResolvedValue("inst_abc123"),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@prisma/client", () => {
  const mockPrisma = {
    siteSettings: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma), __mockPrisma: mockPrisma };
});

jest.mock("@/lib/prisma", () => ({
  prisma: jest.requireMock("@prisma/client").__mockPrisma,
}));

import { fetchTicketDetail, submitTicketReply } from "../actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

// Typed access to the SupportError mock constructor
const { SupportError } = jest.requireMock("@/lib/support") as {
  SupportError: new (message: string, status: number, code?: string) => Error & {
    status: number;
    code?: string;
  };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("fetchTicketDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns success with data when getTicketDetail resolves", async () => {
    const ticket = {
      id: "ticket_1",
      title: "Help needed",
      body: "Something broke",
      type: "normal" as const,
      status: "OPEN" as const,
      githubUrl: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const replies = [
      {
        id: "reply_1",
        ticketId: "ticket_1",
        body: "We are looking into it",
        source: "SUPPORT" as const,
        createdAt: "2026-01-02T00:00:00Z",
      },
    ];
    mockGetTicketDetail.mockResolvedValue({ ticket, replies });

    const result = await fetchTicketDetail("ticket_1");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ ticket, replies });
    expect(mockGetTicketDetail).toHaveBeenCalledWith("ticket_1");
  });

  it("returns error message when getTicketDetail throws SupportError", async () => {
    mockGetTicketDetail.mockRejectedValue(new SupportError("Not found", 404));

    const result = await fetchTicketDetail("ticket_999");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not found");
  });

  it("returns fallback error message for unknown errors", async () => {
    mockGetTicketDetail.mockRejectedValue(new Error("network"));

    const result = await fetchTicketDetail("ticket_1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to fetch ticket");
  });
});

describe("submitTicketReply", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls replyToTicket and returns success with data on valid input", async () => {
    const reply = {
      id: "reply_42",
      ticketId: "ticket_1",
      body: "Thanks for the update",
      source: "CUSTOMER" as const,
      createdAt: "2026-01-03T00:00:00Z",
    };
    mockReplyToTicket.mockResolvedValue(reply);

    const result = await submitTicketReply(
      "ticket_1",
      makeFormData({ body: "Thanks for the update" })
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(reply);
    expect(mockReplyToTicket).toHaveBeenCalledWith(
      "ticket_1",
      "Thanks for the update"
    );
  });

  it("returns validation error and does not call replyToTicket when body is empty", async () => {
    const result = await submitTicketReply(
      "ticket_1",
      makeFormData({ body: "" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mockReplyToTicket).not.toHaveBeenCalled();
  });

  it("returns error and errorCode when replyToTicket throws SupportError with code", async () => {
    mockReplyToTicket.mockRejectedValue(
      new SupportError("Ticket closed", 409, "ticket_not_open")
    );

    const result = await submitTicketReply(
      "ticket_1",
      makeFormData({ body: "One more question" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Ticket closed");
    expect(result.errorCode).toBe("ticket_not_open");
  });

  it("returns error without errorCode when replyToTicket throws SupportError without code", async () => {
    mockReplyToTicket.mockRejectedValue(
      new SupportError("Server error", 500)
    );

    const result = await submitTicketReply(
      "ticket_1",
      makeFormData({ body: "One more question" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Server error");
    expect(result.errorCode).toBeUndefined();
  });
});
