/** @jest-environment node */

/**
 * Tests for POST /api/admin/platform/activate
 *
 * AC-E2E-2: Valid key → saved, cache invalidated, returns { ok: true }
 * AC-E2E-7: Malformed payload → 400 with error message
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetLicenseKey = jest.fn().mockResolvedValue(undefined);
const mockInvalidateCache = jest.fn();
const mockGetInstanceId = jest.fn().mockResolvedValue("inst_abc123");
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/config/app-settings", () => ({
  setLicenseKey: (...args: unknown[]) => mockSetLicenseKey(...args),
}));

jest.mock("@/lib/license", () => ({
  invalidateCache: () => mockInvalidateCache(),
}));

jest.mock("@/lib/telemetry", () => ({
  getInstanceId: (...args: unknown[]) => mockGetInstanceId(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock("@prisma/client", () => {
  const mockPrisma = { siteSettings: { findUnique: jest.fn() } };
  return { PrismaClient: jest.fn(() => mockPrisma), __mockPrisma: mockPrisma };
});

jest.mock("@/lib/prisma", () => ({
  prisma: jest.requireMock("@prisma/client").__mockPrisma,
}));

import { POST } from "../route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/admin/platform/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/admin/platform/activate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AC-E2E-2: Valid key → saved + cache invalidated
  it("saves key and invalidates cache on valid payload", async () => {
    const response = await POST(
      makeRequest({
        licenseKey: "ar_lic_test_abc123",
        email: "admin@store.com",
        instanceId: "inst_abc123",
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ ok: true });

    expect(mockSetLicenseKey).toHaveBeenCalledWith("ar_lic_test_abc123");
    expect(mockInvalidateCache).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/support");
  });

  // AC-E2E-2: Valid key with matching instanceId
  it("accepts payload with matching instanceId", async () => {
    mockGetInstanceId.mockResolvedValue("inst_abc123");

    const response = await POST(
      makeRequest({
        licenseKey: "ar_lic_test_xyz",
        email: "admin@store.com",
        instanceId: "inst_abc123",
      })
    );

    expect(response.status).toBe(200);
    expect(mockSetLicenseKey).toHaveBeenCalledWith("ar_lic_test_xyz");
  });

  // AC-E2E-2: Rejects mismatched instanceId
  it("returns 403 when instanceId does not match", async () => {
    mockGetInstanceId.mockResolvedValue("inst_abc123");

    const response = await POST(
      makeRequest({
        licenseKey: "ar_lic_test_xyz",
        email: "admin@store.com",
        instanceId: "inst_wrong",
      })
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Instance ID mismatch");
    expect(mockSetLicenseKey).not.toHaveBeenCalled();
  });

  // AC-E2E-7: Missing licenseKey → 400
  it("returns 400 when licenseKey is missing", async () => {
    const response = await POST(
      makeRequest({ email: "admin@store.com" })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid payload");
    expect(mockSetLicenseKey).not.toHaveBeenCalled();
  });

  // AC-E2E-7: Missing email → 400
  it("returns 400 when email is missing", async () => {
    const response = await POST(
      makeRequest({ licenseKey: "ar_lic_test_abc123" })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid payload");
  });

  // AC-E2E-7: Invalid email format → 400
  it("returns 400 when email is invalid", async () => {
    const response = await POST(
      makeRequest({ licenseKey: "ar_lic_test_abc123", email: "not-an-email" })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid payload");
  });

  // AC-E2E-7: Empty body → 400
  it("returns 400 on empty object payload", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid payload");
  });

  // Edge: malformed JSON → 500 (caught by try/catch)
  it("returns 500 on malformed JSON body", async () => {
    const request = new Request(
      "http://localhost:3000/api/admin/platform/activate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Activation failed");
  });
});
