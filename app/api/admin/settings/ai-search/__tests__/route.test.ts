/** @jest-environment node */

import { NextRequest } from "next/server";

const requireAdminApiMock = jest.fn();
const siteSettingsFindUniqueMock = jest.fn();
const siteSettingsUpsertMock = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    siteSettings: {
      findUnique: (...args: unknown[]) => siteSettingsFindUniqueMock(...args),
      upsert: (...args: unknown[]) => siteSettingsUpsertMock(...args),
    },
  },
}));

jest.spyOn(console, "error").mockImplementation(() => undefined);

let GET: typeof import("../route").GET;
let PUT: typeof import("../route").PUT;

describe("GET + PUT /api/admin/settings/ai-search (TST-7)", () => {
  beforeAll(async () => {
    const mod = await import("../route");
    GET = mod.GET;
    PUT = mod.PUT;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    requireAdminApiMock.mockResolvedValue({ authorized: true });
  });

  const putRequest = (body: Record<string, unknown>) =>
    new NextRequest("http://localhost/api/admin/settings/ai-search", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("GET returns aiVoicePersona from DB", async () => {
    siteSettingsFindUniqueMock.mockResolvedValue({
      key: "ai_voice_persona",
      value: "I am Brew, a knowledgeable barista.",
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiVoicePersona).toBe("I am Brew, a knowledgeable barista.");
  });

  it("GET returns empty string when no persona saved", async () => {
    siteSettingsFindUniqueMock.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiVoicePersona).toBe("");
  });

  it("GET returns 401 when not authenticated", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: false, error: "Unauthorized" });

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("PUT upserts aiVoicePersona and returns it", async () => {
    const persona = "I speak with warmth and coffee expertise.";
    siteSettingsUpsertMock.mockResolvedValue({ key: "ai_voice_persona", value: persona });

    const response = await PUT(putRequest({ aiVoicePersona: persona }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aiVoicePersona).toBe(persona);
    expect(siteSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "ai_voice_persona" },
        update: { value: persona },
      })
    );
  });

  it("PUT returns 400 when aiVoicePersona exceeds 2000 chars", async () => {
    const response = await PUT(putRequest({ aiVoicePersona: "x".repeat(2001) }));
    expect(response.status).toBe(400);
    expect(siteSettingsUpsertMock).not.toHaveBeenCalled();
  });

  it("PUT returns 401 when not authenticated", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: false, error: "Unauthorized" });

    const response = await PUT(putRequest({ aiVoicePersona: "some persona" }));
    expect(response.status).toBe(401);
  });
});
