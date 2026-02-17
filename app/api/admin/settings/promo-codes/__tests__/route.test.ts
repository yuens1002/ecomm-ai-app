/** @jest-environment node */

import { NextRequest } from "next/server";

const requireAdminMock = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdminMock(),
}));

// In-memory store that mirrors Prisma's siteSettings table
let settingsStore: Record<string, string>;

jest.mock("@/lib/prisma", () => ({
  prisma: {
    siteSettings: {
      findUnique: jest.fn(({ where }: { where: { key: string } }) => {
        const value = settingsStore[where.key];
        return value !== undefined ? { key: where.key, value } : null;
      }),
      upsert: jest.fn(
        ({
          where,
          update,
          create,
        }: {
          where: { key: string };
          update: { value: string };
          create: { key: string; value: string };
        }) => {
          settingsStore[where.key] = update.value ?? create.value;
          return { key: where.key, value: settingsStore[where.key] };
        }
      ),
    },
  },
}));

let GET: typeof import("../route").GET;
let PUT: typeof import("../route").PUT;

describe("Promo codes settings API", () => {
  beforeAll(async () => {
    const mod = await import("../route");
    GET = mod.GET;
    PUT = mod.PUT;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    requireAdminMock.mockResolvedValue(true);
    settingsStore = {};
  });

  const putRequest = (body: Record<string, unknown>) =>
    new NextRequest("http://localhost/api/admin/settings/promo-codes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns enabled: false when no setting exists (default)", async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ enabled: false });
  });

  it("round-trips enabled: true via PUT then GET", async () => {
    const putRes = await PUT(putRequest({ enabled: true }));
    expect(putRes.status).toBe(200);

    const getRes = await GET();
    const json = await getRes.json();

    expect(json).toEqual({ enabled: true });
  });

  it("round-trips enabled: false after being set to true", async () => {
    await PUT(putRequest({ enabled: true }));
    await PUT(putRequest({ enabled: false }));

    const json = await (await GET()).json();
    expect(json).toEqual({ enabled: false });
  });

  it("rejects non-boolean enabled value with 400", async () => {
    const res = await PUT(putRequest({ enabled: "yes" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("rejects missing enabled field with 400", async () => {
    const res = await PUT(putRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 500 when admin check fails on GET", async () => {
    requireAdminMock.mockRejectedValue(new Error("Unauthorized"));

    const res = await GET();
    expect(res.status).toBe(500);
  });

  it("returns 500 when admin check fails on PUT", async () => {
    requireAdminMock.mockRejectedValue(new Error("Unauthorized"));

    const res = await PUT(putRequest({ enabled: true }));
    expect(res.status).toBe(500);
  });
});
