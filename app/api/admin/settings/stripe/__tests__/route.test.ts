/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "../route";

// Mock dependencies
jest.mock("@/lib/admin", () => ({
  requireAdminApi: jest.fn(),
}));
jest.mock("@/lib/services/stripe", () => ({
  resetStripeClient: jest.fn(),
}));
jest.mock("@/lib/payments/credentials", () => ({
  loadStripeCredentials: jest.fn(),
  saveStripeCredentials: jest.fn(),
  clearStripeCredentials: jest.fn(),
  getStripeConfigStatus: jest.fn(),
}));

// Mock Stripe constructor for PUT validation
const mockRetrieve = jest.fn();
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    accounts: { retrieve: mockRetrieve },
  }));
});

import { requireAdminApi } from "@/lib/admin";
import { resetStripeClient } from "@/lib/services/stripe";
import {
  loadStripeCredentials,
  saveStripeCredentials,
  clearStripeCredentials,
  getStripeConfigStatus,
} from "@/lib/payments/credentials";

const mockRequireAdmin = requireAdminApi as jest.MockedFunction<
  typeof requireAdminApi
>;
const mockReset = resetStripeClient as jest.MockedFunction<
  typeof resetStripeClient
>;
const mockLoadCreds = loadStripeCredentials as jest.MockedFunction<
  typeof loadStripeCredentials
>;
const mockSaveCreds = saveStripeCredentials as jest.MockedFunction<
  typeof saveStripeCredentials
>;
const mockClearCreds = clearStripeCredentials as jest.MockedFunction<
  typeof clearStripeCredentials
>;
const mockGetStatus = getStripeConfigStatus as jest.MockedFunction<
  typeof getStripeConfigStatus
>;

function authorized() {
  mockRequireAdmin.mockResolvedValue({ authorized: true, userId: "admin_1" });
}
function unauthorized() {
  mockRequireAdmin.mockResolvedValue({
    authorized: false,
    error: "Unauthorized",
  });
}
function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/settings/stripe", {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
}

function makeEmptyDbStatus() {
  return {
    hasRow: false,
    accountId: null,
    accountName: null,
    isTestMode: null,
    lastValidatedAt: null,
    hasSecretKey: false,
    hasWebhookSecret: false,
    publishableKey: null,
    decryptionError: false,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
});

describe("GET /api/admin/settings/stripe", () => {
  it("returns 401 when unauthorized", async () => {
    unauthorized();
    mockGetStatus.mockResolvedValue(makeEmptyDbStatus());
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns config status to authorized admin", async () => {
    authorized();
    mockGetStatus.mockResolvedValue(makeEmptyDbStatus());
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.db.hasRow).toBe(false);
    expect(data.envSecretSet).toBe(false);
  });

  it("returns masked secret key when DB row exists", async () => {
    authorized();
    mockGetStatus.mockResolvedValue({
      ...makeEmptyDbStatus(),
      hasRow: true,
      hasSecretKey: true,
    });
    mockLoadCreds.mockResolvedValue({
      secretKey: "sk_test_abcdefgh1234",
      publishableKey: null,
      webhookSecret: null,
      accountId: "acct_123",
      accountName: "Acme Coffee",
      isTestMode: true,
      lastValidatedAt: null,
    });
    const res = await GET();
    const data = await res.json();
    expect(data.db.secretKeyMasked).toBe("••••••••1234");
  });
});

describe("PUT /api/admin/settings/stripe (validate + save)", () => {
  it("returns 401 when unauthorized", async () => {
    unauthorized();
    const res = await PUT(makeRequest("PUT", { secretKey: "sk_test_abc123" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 on test/live mode mismatch before calling Stripe", async () => {
    authorized();
    const res = await PUT(
      makeRequest("PUT", {
        secretKey: "sk_test_abc123",
        publishableKey: "pk_live_abc123",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Something went wrong, one or more keys may be incorrect.");
    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("drops masked secretKey from update (don't overwrite stored value)", async () => {
    authorized();
    mockSaveCreds.mockResolvedValue(undefined);
    const res = await PUT(
      makeRequest("PUT", { secretKey: "••••••••1234", publishableKey: "pk_test_new" })
    );
    // secretKey is masked → Stripe re-validation not called, secretKey not saved
    expect(mockRetrieve).not.toHaveBeenCalled();
    const saveCall = mockSaveCreds.mock.calls[0]?.[0];
    expect(saveCall).not.toHaveProperty("secretKey");
    expect(saveCall?.publishableKey).toBe("pk_test_new");
    expect(res.status).toBe(200);
  });

  it("returns 400 when Stripe API rejects the key", async () => {
    authorized();
    mockRetrieve.mockRejectedValue(new Error("No such account: invalid_key"));
    const res = await PUT(makeRequest("PUT", { secretKey: "sk_test_invalid123" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("validates, saves credentials, and resets singleton", async () => {
    authorized();
    mockRetrieve.mockResolvedValue({
      id: "acct_123",
      settings: { dashboard: { display_name: "Acme Coffee" } },
      country: "US",
      default_currency: "usd",
    });
    mockSaveCreds.mockResolvedValue(undefined);

    const res = await PUT(
      makeRequest("PUT", {
        secretKey: "sk_test_abc123",
        publishableKey: "pk_test_abc",
        webhookSecret: "whsec_abc",
      })
    );
    expect(res.status).toBe(200);
    expect(mockSaveCreds).toHaveBeenCalledWith(
      expect.objectContaining({
        secretKey: "sk_test_abc123",
        publishableKey: "pk_test_abc",
        webhookSecret: "whsec_abc",
        accountId: "acct_123",
        isTestMode: true,
      })
    );
    expect(mockReset).toHaveBeenCalled();
  });
});

describe("PUT — short-circuit (no actual changes)", () => {
  it("returns 200 without saving when payload has no fields", async () => {
    authorized();
    const res = await PUT(makeRequest("PUT", {}));
    expect(res.status).toBe(200);
    expect(mockSaveCreds).not.toHaveBeenCalled();
    expect(mockRetrieve).not.toHaveBeenCalled();
  });

  it("returns 200 without saving when all submitted values are masked placeholders", async () => {
    authorized();
    const res = await PUT(
      makeRequest("PUT", { secretKey: "••••••••1234", webhookSecret: "••••••••abcd" })
    );
    expect(res.status).toBe(200);
    expect(mockSaveCreds).not.toHaveBeenCalled();
    expect(mockRetrieve).not.toHaveBeenCalled();
  });
});

describe("PUT — format validation", () => {
  const GENERIC = "Something went wrong, one or more keys may be incorrect.";

  it("rejects invalid secret key format before Stripe call", async () => {
    authorized();
    const res = await PUT(makeRequest("PUT", { secretKey: "not_a_valid_key" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: GENERIC });
    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("rejects invalid publishable key format (regression: freeform text was accepted)", async () => {
    authorized();
    const res = await PUT(makeRequest("PUT", { publishableKey: "df fdfe" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: GENERIC });
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("rejects publishable key missing pk_ prefix", async () => {
    authorized();
    const res = await PUT(makeRequest("PUT", { publishableKey: "sk_test_wrong_type" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: GENERIC });
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("rejects webhook secret not starting with whsec_", async () => {
    authorized();
    const res = await PUT(makeRequest("PUT", { webhookSecret: "not_a_whsec_value" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: GENERIC });
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("accepts valid key shapes (sk_test_, pk_test_, whsec_)", async () => {
    authorized();
    mockRetrieve.mockResolvedValue({
      id: "acct_123",
      settings: { dashboard: { display_name: "Test" } },
    });
    mockSaveCreds.mockResolvedValue(undefined);
    const res = await PUT(
      makeRequest("PUT", {
        secretKey: "sk_test_valid123",
        publishableKey: "pk_test_valid123",
        webhookSecret: "whsec_valid",
      })
    );
    expect(res.status).toBe(200);
  });

  it("accepts live mode keys (sk_live_, pk_live_)", async () => {
    authorized();
    mockRetrieve.mockResolvedValue({
      id: "acct_live",
      settings: { dashboard: { display_name: "Live Account" } },
    });
    mockSaveCreds.mockResolvedValue(undefined);
    const res = await PUT(
      makeRequest("PUT", {
        secretKey: "sk_live_valid123",
        publishableKey: "pk_live_valid123",
      })
    );
    expect(res.status).toBe(200);
  });
});

describe("PUT — effective-set mode validation", () => {
  const GENERIC = "Something went wrong, one or more keys may be incorrect.";

  it("catches mismatch when pub key changes against existing DB secret key", async () => {
    authorized();
    mockLoadCreds.mockResolvedValue({
      secretKey: "sk_live_existing123",
      publishableKey: null,
      webhookSecret: null,
      accountId: null,
      accountName: null,
      isTestMode: false,
      lastValidatedAt: null,
    });
    const res = await PUT(makeRequest("PUT", { publishableKey: "pk_test_new123" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: GENERIC });
    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("catches mismatch when secret key changes against existing DB pub key", async () => {
    // Simulates: previously saved live keys, user now submits a test secret key
    authorized();
    mockLoadCreds.mockResolvedValue({
      secretKey: "sk_live_oldkey123",
      publishableKey: "pk_live_existing123",
      webhookSecret: null,
      accountId: null,
      accountName: null,
      isTestMode: false,
      lastValidatedAt: null,
    });
    const res = await PUT(makeRequest("PUT", { secretKey: "sk_test_new123" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: GENERIC });
    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("saves without Stripe API call when only pub key changes and modes match", async () => {
    authorized();
    mockLoadCreds.mockResolvedValue({
      secretKey: "sk_test_existing123",
      publishableKey: "pk_test_old",
      webhookSecret: null,
      accountId: null,
      accountName: null,
      isTestMode: true,
      lastValidatedAt: null,
    });
    mockSaveCreds.mockResolvedValue(undefined);
    const res = await PUT(makeRequest("PUT", { publishableKey: "pk_test_new123" }));
    expect(res.status).toBe(200);
    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(mockSaveCreds).toHaveBeenCalledWith({ publishableKey: "pk_test_new123" });
  });

  it("saves without Stripe API call when only webhook secret changes", async () => {
    authorized();
    mockSaveCreds.mockResolvedValue(undefined);
    const res = await PUT(makeRequest("PUT", { webhookSecret: "whsec_new_value" }));
    expect(res.status).toBe(200);
    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(mockSaveCreds).toHaveBeenCalledWith({ webhookSecret: "whsec_new_value" });
  });
});

describe("DELETE /api/admin/settings/stripe", () => {
  it("returns 401 when unauthorized", async () => {
    unauthorized();
    const res = await DELETE();
    expect(res.status).toBe(401);
    expect(mockClearCreds).not.toHaveBeenCalled();
  });

  it("clears credentials and resets singleton when authorized", async () => {
    authorized();
    mockClearCreds.mockResolvedValue(undefined);
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(mockClearCreds).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
  });
});
