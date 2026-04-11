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

  const mockConversationResponse = JSON.stringify({
    answers: [
      "I'd start you with the Ethiopian Yirgacheffe — it's bright, citrusy, and it'll change how you think about light roasts.",
      "Oh, you're after fruity and bright — you want the Kenya AA. It's like sipping on a blackcurrant jam.",
      "For French press, I always point people to the Sumatra — it's full-bodied with a chocolatey finish that holds up beautifully.",
    ],
  });

  // TST-5: unauthenticated request returns 401
  it("returns 401 when not authenticated (TST-5)", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: false, error: "Unauthorized" });

    const response = await POST(postRequest({ rawPersona: "I love bold coffees." }));

    expect(response.status).toBe(401);
    expect(chatCompletionMock).not.toHaveBeenCalled();
  });

  // TST-6: authenticated request returns conversations array
  it("returns conversations array on success (TST-6)", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    chatCompletionMock.mockResolvedValue({
      text: mockConversationResponse,
      finishReason: "stop",
      usage: { promptTokens: 80, completionTokens: 120, totalTokens: 200 },
    });

    const response = await POST(postRequest({ rawPersona: "I love bold coffees." }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("conversations");
    expect(Array.isArray(data.conversations)).toBe(true);
    expect(data.conversations).toHaveLength(3);
    expect(data.conversations[0]).toHaveProperty("question");
    expect(data.conversations[0]).toHaveProperty("answer");
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
