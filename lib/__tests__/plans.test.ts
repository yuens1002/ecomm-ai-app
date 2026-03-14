/**
 * Tests for fetchPlans() from lib/plans.ts
 *
 * AC-E2E-9: Platform unreachable → returns empty array, no crash
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { fetchPlans, invalidatePlansCache } from "../plans";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("fetchPlans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidatePlansCache();
  });

  // AC-E2E-9: Network error → empty array, no crash
  it("returns empty array when fetch throws (network error)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fetch failed"));

    const plans = await fetchPlans();

    expect(plans).toEqual([]);
  });

  // AC-E2E-9: Platform returns 500 → empty array
  it("returns empty array when platform returns 500", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const plans = await fetchPlans();

    expect(plans).toEqual([]);
  });

  // AC-E2E-9: Platform returns 503 → empty array
  it("returns empty array when platform returns 503", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    const plans = await fetchPlans();

    expect(plans).toEqual([]);
  });

  // Happy path: platform returns plans
  it("returns plans when platform responds successfully", async () => {
    const mockPlans = [
      {
        slug: "pro",
        name: "Pro",
        description: "Professional plan",
        price: { amount: 29, currency: "USD", interval: "month" },
        features: ["ga", "ai-product-ops"],
        benefits: ["Google Analytics integration"],
        details: {},
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ plans: mockPlans }),
    });

    const plans = await fetchPlans();

    expect(plans).toEqual(mockPlans);
    expect(plans).toHaveLength(1);
    expect(plans[0].slug).toBe("pro");
  });

  // Cache: second call uses cached data
  it("uses cached data on subsequent calls within TTL", async () => {
    const mockPlans = [{ slug: "pro", name: "Pro" }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ plans: mockPlans }),
    });

    await fetchPlans();
    const plans = await fetchPlans();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(plans).toEqual(mockPlans);
  });

  // Empty response: platform returns { plans: [] }
  it("returns empty array when platform returns empty plans list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ plans: [] }),
    });

    const plans = await fetchPlans();
    expect(plans).toEqual([]);
  });
});
