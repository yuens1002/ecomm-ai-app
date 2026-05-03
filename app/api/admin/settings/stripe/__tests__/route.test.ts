/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "../route";

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
jest.mock("@/lib/payments/credentials/encryption", () => ({
  isEncryptionKeySet: jest.fn(),
}));

// Mock Stripe constructor for POST/PUT validation
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
import { isEncryptionKeySet } from "@/lib/payments/credentials/encryption";

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
const mockEncKeySet = isEncryptionKeySet as jest.MockedFunction<
  typeof isEncryptionKeySet
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
function makeRequest(
  method: string,
  body?: unknown
): NextRequest {
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
    mockEncKeySet.mockReturnValue(false);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns config status to authorized admin", async () => {
    authorized();
    mockEncKeySet.mockReturnValue(true);
    mockGetStatus.mockResolvedValue(makeEmptyDbStatus());
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.encryptionKeySet).toBe(true);
    expect(data.db.hasRow).toBe(false);
  });

  it("returns masked secret key when DB row exists", async () => {
    authorized();
    mockEncKeySet.mockReturnValue(true);
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

describe("POST /api/admin/settings/stripe (validate-only)", () => {
  it("returns 401 when unauthorized", async () => {
    unauthorized();
    const res = await POST(makeRequest("POST", { secretKey: "sk_test_abc123" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 on malformed secret key", async () => {
    authorized();
    const res = await POST(makeRequest("POST", { secretKey: "not-a-key" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 on test/live mode mismatch BEFORE calling Stripe", async () => {
    authorized();
    const res = await POST(
      makeRequest("POST", {
        secretKey: "sk_test_abc123",
        publishableKey: "pk_live_abc123",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("mismatch");
    // Stripe should NOT have been called
    expect(mockRetrieve).not.toHaveBeenCalled();
  });

  it("returns 400 when Stripe API rejects the key", async () => {
    authorized();
    mockRetrieve.mockRejectedValue(new Error("No such account: invalid_key"));
    const res = await POST(
      makeRequest("POST", { secretKey: "sk_test_invalid123" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("returns account metadata on successful validation (no save)", async () => {
    authorized();
    mockRetrieve.mockResolvedValue({
      id: "acct_123",
      settings: { dashboard: { display_name: "Acme Coffee" } },
      country: "US",
      default_currency: "usd",
    });
    const res = await POST(
      makeRequest("POST", { secretKey: "sk_test_abc123" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.accountName).toBe("Acme Coffee");
    expect(data.accountId).toBe("acct_123");
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });
});

describe("PUT /api/admin/settings/stripe (save)", () => {
  it("returns 401 when unauthorized", async () => {
    unauthorized();
    const res = await PUT(
      makeRequest("PUT", { secretKey: "sk_test_abc123" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 when encryption key not set", async () => {
    authorized();
    mockEncKeySet.mockReturnValue(false);
    const res = await PUT(
      makeRequest("PUT", { secretKey: "sk_test_abc123" })
    );
    expect(res.status).toBe(503);
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("returns 400 on test/live mismatch BEFORE calling Stripe", async () => {
    authorized();
    mockEncKeySet.mockReturnValue(true);
    const res = await PUT(
      makeRequest("PUT", {
        secretKey: "sk_test_abc123",
        publishableKey: "pk_live_abc123",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("mismatch");
    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(mockSaveCreds).not.toHaveBeenCalled();
  });

  it("drops masked secretKey from update (don't overwrite stored value)", async () => {
    authorized();
    mockEncKeySet.mockReturnValue(true);
    mockSaveCreds.mockResolvedValue(undefined);
    const res = await PUT(
      makeRequest("PUT", { secretKey: "••••••••1234", publishableKey: "pk_test_new" })
    );
    // secretKey is masked, so Stripe re-validation not called, and secretKey not saved
    expect(mockRetrieve).not.toHaveBeenCalled();
    const saveCall = mockSaveCreds.mock.calls[0]?.[0];
    expect(saveCall).not.toHaveProperty("secretKey");
    expect(saveCall?.publishableKey).toBe("pk_test_new");
    expect(res.status).toBe(200);
  });

  it("encrypts and saves credentials after successful validation, resets singleton", async () => {
    authorized();
    mockEncKeySet.mockReturnValue(true);
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
