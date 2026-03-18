/**
 * Tests for startCheckout server action
 *
 * AC-E2E-6: Platform returns 500 → error result (no redirect)
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRequireAdmin = jest.fn().mockResolvedValue(undefined);
const mockGetInstanceId = jest.fn().mockResolvedValue("inst_abc123");
const mockFetch = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

jest.mock("@/lib/telemetry", () => ({
  getInstanceId: (...args: unknown[]) => mockGetInstanceId(...args),
}));

jest.mock("@prisma/client", () => {
  const mockPrisma = {
    siteSettings: {
      findUnique: jest.fn().mockResolvedValue({ value: "shop@test.com" }),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma), __mockPrisma: mockPrisma };
});

jest.mock("@/lib/prisma", () => ({
  prisma: jest.requireMock("@prisma/client").__mockPrisma,
}));

// Replace global fetch
global.fetch = mockFetch;

import { startCheckout } from "../actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(planSlug: string): FormData {
  const fd = new FormData();
  fd.set("planSlug", planSlug);
  return fd;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("startCheckout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AC-E2E-6: Platform returns 500 → error, no redirect URL
  it("returns error when platform responds with 500", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const result = await startCheckout(makeFormData("pro"));

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.url).toBeUndefined();
  });

  // AC-E2E-6: Platform returns 500 with empty body
  it("returns fallback error message on 500 with empty body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(""),
    });

    const result = await startCheckout(makeFormData("pro"));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Checkout failed");
  });

  // AC-E2E-6: Network error (platform unreachable)
  it("returns error when fetch throws (network failure)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fetch failed"));

    const result = await startCheckout(makeFormData("pro"));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to start checkout");
  });

  // Happy path: platform returns checkout URL
  it("returns success with URL when platform responds 200", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: "https://checkout.stripe.com/test" }),
    });

    const result = await startCheckout(makeFormData("pro"));

    expect(result.success).toBe(true);
    expect(result.url).toBe("https://checkout.stripe.com/test");
  });

  // Validation: empty planSlug → error
  it("returns error for empty planSlug", async () => {
    const result = await startCheckout(makeFormData(""));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid plan");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
