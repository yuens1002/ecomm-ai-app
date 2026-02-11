/** @jest-environment node */

import { NextRequest } from "next/server";

const requireAdminApiMock = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

// In-memory store that mirrors Prisma's siteSettings table
let settingsStore: Record<string, string>;

jest.mock("@/lib/prisma", () => ({
  prisma: {
    siteSettings: {
      findMany: jest.fn(({ where }: { where: { key: { in: string[] } } }) => {
        return where.key.in
          .filter((k: string) => settingsStore[k] !== undefined)
          .map((k: string) => ({ key: k, value: settingsStore[k] }));
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

describe("Footer contact settings API", () => {
  beforeAll(async () => {
    const mod = await import("../route");
    GET = mod.GET;
    PUT = mod.PUT;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    settingsStore = {};
  });

  const putRequest = (body: Record<string, unknown>) =>
    new NextRequest("http://localhost/api/admin/settings/footer-contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns defaults when no settings exist", async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      showHours: false,
      hoursText: "Mon-Fri 7am-7pm",
      showEmail: false,
      email: "hello@artisan-roast.com",
    });
  });

  it("round-trips all fields: PUT then GET returns same values", async () => {
    const payload = {
      showHours: true,
      hoursText: "Mon-Sat: 6am-8pm\nSun: Closed",
      showEmail: true,
      email: "shop@example.com",
    };

    const putRes = await PUT(putRequest(payload));
    expect(putRes.status).toBe(200);

    const getRes = await GET();
    const json = await getRes.json();

    expect(json).toEqual(payload);
  });

  it("persists showEmail=false correctly", async () => {
    // First set to true
    await PUT(
      putRequest({
        showHours: false,
        hoursText: "24/7",
        showEmail: true,
        email: "a@b.com",
      })
    );

    // Then set to false
    await PUT(
      putRequest({
        showHours: false,
        hoursText: "24/7",
        showEmail: false,
        email: "a@b.com",
      })
    );

    const json = await (await GET()).json();
    expect(json.showEmail).toBe(false);
  });

  it("persists hoursText changes across saves", async () => {
    await PUT(
      putRequest({
        showHours: true,
        hoursText: "Original hours",
        showEmail: false,
        email: "x@y.com",
      })
    );

    await PUT(
      putRequest({
        showHours: true,
        hoursText: "Updated hours",
        showEmail: false,
        email: "x@y.com",
      })
    );

    const json = await (await GET()).json();
    expect(json.hoursText).toBe("Updated hours");
  });

  it("rejects unauthenticated GET requests", async () => {
    requireAdminApiMock.mockResolvedValue({
      authorized: false,
      error: "Unauthorized",
    });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated PUT requests", async () => {
    requireAdminApiMock.mockResolvedValue({
      authorized: false,
      error: "Unauthorized",
    });

    const res = await PUT(
      putRequest({
        showHours: true,
        hoursText: "test",
        showEmail: true,
        email: "test@test.com",
      })
    );
    expect(res.status).toBe(401);
  });

  it("ignores unknown fields in PUT body", async () => {
    await PUT(
      putRequest({
        showHours: true,
        hoursText: "Valid hours",
        showEmail: true,
        email: "real@email.com",
        // These should be silently ignored, not saved
        businessHours: "Wrong field name",
        showEmailInFooter: true,
      })
    );

    const json = await (await GET()).json();
    expect(json.hoursText).toBe("Valid hours");
    expect(json).not.toHaveProperty("businessHours");
    expect(json).not.toHaveProperty("showEmailInFooter");
  });
});
