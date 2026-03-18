/**
 * Tests for submitCommunityIssue server action
 *
 * AC-E2E-8: No contactEmail configured → error message
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireAdmin = jest.fn().mockResolvedValue(undefined);
const mockGetInstanceId = jest.fn().mockResolvedValue("inst_abc123");
const mockCreateCommunityIssue = jest
  .fn()
  .mockResolvedValue({ issueNumber: 42, issueUrl: "https://github.com/test/42" });

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

jest.mock("@/lib/telemetry", () => ({
  getInstanceId: (...args: unknown[]) => mockGetInstanceId(...args),
}));

jest.mock("@/lib/support", () => ({
  createCommunityIssue: (...args: unknown[]) =>
    mockCreateCommunityIssue(...args),
  SupportError: class SupportError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = "SupportError";
      this.status = status;
    }
  },
  // Re-export unused imports so module resolution doesn't fail
  listTickets: jest.fn(),
  createTicket: jest.fn(),
}));

jest.mock("@/lib/config/app-settings", () => ({
  setLicenseKey: jest.fn(),
}));

jest.mock("@/lib/license", () => ({
  invalidateCache: jest.fn(),
  validateLicense: jest.fn().mockResolvedValue({ tier: "FREE", features: [] }),
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

const { __mockPrisma: mockPrisma } = jest.requireMock("@prisma/client") as {
  __mockPrisma: {
    siteSettings: {
      findUnique: jest.Mock;
    };
  };
};

import { submitCommunityIssue } from "../actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(title: string, body?: string): FormData {
  const fd = new FormData();
  fd.set("title", title);
  if (body) fd.set("body", body);
  return fd;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("submitCommunityIssue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AC-E2E-8: No contactEmail configured → error
  it("returns error when contactEmail is not configured", async () => {
    mockPrisma.siteSettings.findUnique.mockResolvedValue(null);

    const result = await submitCommunityIssue(
      makeFormData("Bug report", "Something broke")
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Configure contact email in Settings > Contact"
    );
    expect(mockCreateCommunityIssue).not.toHaveBeenCalled();
  });

  // AC-E2E-8: contactEmail exists but empty → error
  it("returns error when contactEmail value is empty string", async () => {
    mockPrisma.siteSettings.findUnique.mockResolvedValue({ value: "" });

    const result = await submitCommunityIssue(
      makeFormData("Bug report", "Something broke")
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Configure contact email in Settings > Contact"
    );
  });

  // Happy path: contactEmail exists → issue created
  it("creates issue when contactEmail is configured", async () => {
    mockPrisma.siteSettings.findUnique.mockResolvedValue({
      value: "shop@artisanroast.com",
    });

    const result = await submitCommunityIssue(
      makeFormData("Feature request", "Add dark mode")
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      issueNumber: 42,
      issueUrl: "https://github.com/test/42",
    });
    expect(mockCreateCommunityIssue).toHaveBeenCalledWith({
      title: "Feature request",
      body: "Add dark mode",
      email: "shop@artisanroast.com",
      instanceId: "inst_abc123",
      termsAccepted: true,
    });
  });

  // Validation: empty title → error
  it("returns validation error for empty title", async () => {
    const result = await submitCommunityIssue(makeFormData(""));

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mockPrisma.siteSettings.findUnique).not.toHaveBeenCalled();
  });
});
