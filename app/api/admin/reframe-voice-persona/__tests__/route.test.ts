/** @jest-environment node */

import { NextRequest } from "next/server";

const requireAdminApiMock = jest.fn();
const chatCompletionMock = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/ai-client", () => ({
  chatCompletion: (...args: unknown[]) => chatCompletionMock(...args),
}));

jest.spyOn(console, "error").mockImplementation(() => undefined);

let POST: typeof import("../route").POST;

describe("POST /api/admin/reframe-voice-persona", () => {
  beforeAll(async () => {
    const mod = await import("../route");
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const postRequest = (body: Record<string, unknown>) =>
    new NextRequest("http://localhost/api/admin/reframe-voice-persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  // TST-5: unauthenticated request returns 401
  it("returns 401 when not authenticated (TST-5)", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: false, error: "Unauthorized" });

    const response = await POST(postRequest({ rawPersona: "I love bold coffees." }));

    expect(response.status).toBe(401);
    expect(chatCompletionMock).not.toHaveBeenCalled();
  });

  // TST-6: authenticated request returns reframedPersona
  it("returns reframedPersona on success (TST-6)", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    chatCompletionMock.mockResolvedValue({
      text: "  I am your knowledgeable coffee guide, passionate about bold, full-bodied roasts.  ",
      finishReason: "stop",
      usage: { promptTokens: 50, completionTokens: 80, totalTokens: 130 },
    });

    const response = await POST(postRequest({ rawPersona: "I love bold coffees." }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("reframedPersona");
    expect(data.reframedPersona).toBe(
      "I am your knowledgeable coffee guide, passionate about bold, full-bodied roasts."
    );
    expect(chatCompletionMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when rawPersona is missing", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });

    const response = await POST(postRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 400 when rawPersona exceeds 2000 chars", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });

    const response = await POST(postRequest({ rawPersona: "x".repeat(2001) }));
    expect(response.status).toBe(400);
  });
});
