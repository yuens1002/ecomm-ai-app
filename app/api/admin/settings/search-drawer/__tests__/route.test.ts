/** @jest-environment node */

import { GET, PUT } from "../route";

const requireAdminApiMock = jest.fn();
const findManyMock = jest.fn();
const upsertMock = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    siteSettings: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      upsert: (...args: unknown[]) => upsertMock(...args),
    },
  },
}));

beforeEach(() => {
  requireAdminApiMock.mockReset();
  findManyMock.mockReset();
  upsertMock.mockReset();
  requireAdminApiMock.mockResolvedValue({ authorized: true });
});

describe("GET /api/admin/settings/search-drawer", () => {
  it("returns 401 when not authorized", async () => {
    requireAdminApiMock.mockResolvedValue({
      authorized: false,
      error: "Unauthorized",
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns defaults when no SiteSettings rows exist", async () => {
    findManyMock.mockResolvedValue([]);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.chipsHeading).toBe("Top Categories");
    expect(data.chipCategories).toEqual([]);
    expect(data.curatedCategory).toBeNull();
  });

  it("returns parsed values when rows exist", async () => {
    findManyMock.mockResolvedValue([
      { key: "search_drawer_chips_heading", value: "Browse" },
      {
        key: "search_drawer_chip_categories",
        value: JSON.stringify(["a", "b", "c"]),
      },
      { key: "search_drawer_curated_category", value: "staff-picks" },
    ]);
    const res = await GET();
    const data = await res.json();
    expect(data.chipsHeading).toBe("Browse");
    expect(data.chipCategories).toEqual(["a", "b", "c"]);
    expect(data.curatedCategory).toBe("staff-picks");
  });
});

describe("PUT /api/admin/settings/search-drawer", () => {
  function makeRequest(body: unknown): Request {
    return new Request("http://localhost/api/admin/settings/search-drawer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when not authorized", async () => {
    requireAdminApiMock.mockResolvedValue({
      authorized: false,
      error: "Unauthorized",
    });
    const res = await PUT(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it("rejects empty heading with 400", async () => {
    const res = await PUT(
      makeRequest({
        chipsHeading: "",
        chipCategories: [],
        curatedCategory: null,
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/heading is required/i);
  });

  it("rejects heading >60 chars with 400", async () => {
    const res = await PUT(
      makeRequest({
        chipsHeading: "x".repeat(61),
        chipCategories: [],
        curatedCategory: null,
      })
    );
    expect(res.status).toBe(400);
  });

  it("rejects >6 chip categories with 400", async () => {
    const res = await PUT(
      makeRequest({
        chipsHeading: "Top Categories",
        chipCategories: ["a", "b", "c", "d", "e", "f", "g"],
        curatedCategory: null,
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/up to 6/i);
  });

  it("persists valid payload and returns it", async () => {
    upsertMock.mockResolvedValue({});
    const res = await PUT(
      makeRequest({
        chipsHeading: "Top Categories",
        chipCategories: ["staff-picks", "fruity-floral"],
        curatedCategory: "staff-picks",
      })
    );
    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledTimes(3);

    // Each upsert should use update: { value: ... } (overwrite on reseed pattern)
    upsertMock.mock.calls.forEach(([call]) => {
      expect(call).toHaveProperty("update");
      expect((call as { update: unknown }).update).toHaveProperty("value");
    });
  });

  it("accepts null curatedCategory (admin clears it)", async () => {
    upsertMock.mockResolvedValue({});
    const res = await PUT(
      makeRequest({
        chipsHeading: "Top Categories",
        chipCategories: [],
        curatedCategory: null,
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.curatedCategory).toBeNull();
  });
});
