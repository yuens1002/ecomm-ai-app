/** @jest-environment node */
/**
 * Unit tests for GET /api/settings/voice-surfaces
 * AC-TST-1: lazy init — generates + upserts on first Counter open when AI configured
 * AC-TST-2: cached path — returns stored value without AI call
 * AC-TST-3: default examples fallback — passes DEFAULT_VOICE_EXAMPLES when none stored
 * AC-TST-4: AI not configured — returns DEFAULT_VOICE_SURFACES, no upsert
 */

const siteSettingsFindUniqueMock = jest.fn();
const siteSettingsUpsertMock = jest.fn();
const generateVoiceSurfacesMock = jest.fn();
const isAIConfiguredMock = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    siteSettings: {
      findUnique: (...args: unknown[]) => siteSettingsFindUniqueMock(...args),
      upsert: (...args: unknown[]) => siteSettingsUpsertMock(...args),
    },
  },
}));

const TEST_PROMPT_HASH = "test-prompt-hash";
jest.mock("@/lib/ai/voice-surfaces.server", () => ({
  generateVoiceSurfaces: (...args: unknown[]) => generateVoiceSurfacesMock(...args),
  SURFACE_PROMPT_HASH: TEST_PROMPT_HASH,
}));

jest.mock("@/lib/ai-client", () => ({
  isAIConfigured: () => isAIConfiguredMock(),
}));

jest.spyOn(console, "error").mockImplementation(() => undefined);

import { DEFAULT_VOICE_SURFACES } from "@/lib/ai/voice-surfaces";
import { DEFAULT_VOICE_EXAMPLES } from "@/lib/ai/voice-examples";

let GET: typeof import("../route").GET;

describe("GET /api/settings/voice-surfaces", () => {
  beforeAll(async () => {
    const mod = await import("../route");
    GET = mod.GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    isAIConfiguredMock.mockResolvedValue(true);
    generateVoiceSurfacesMock.mockResolvedValue({ ...DEFAULT_VOICE_SURFACES });
    siteSettingsUpsertMock.mockResolvedValue({});
    // Default: no cached surfaces, no stored examples
    siteSettingsFindUniqueMock.mockResolvedValue(null);
  });

  // AC-TST-1: lazy init
  it("calls generateVoiceSurfaces and upserts when no cached surfaces and AI is configured", async () => {
    siteSettingsFindUniqueMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(generateVoiceSurfacesMock).toHaveBeenCalledTimes(1);
    expect(siteSettingsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "ai_voice_surfaces" } })
    );
  });

  // AC-TST-2: cached path
  it("returns stored surfaces without calling generateVoiceSurfaces when cache exists", async () => {
    const cached = { ...DEFAULT_VOICE_SURFACES, "greeting.home": "Cached greeting!" };
    // findUnique calls: surfaces, examples, hash — all via Promise.all
    siteSettingsFindUniqueMock
      .mockResolvedValueOnce({ key: "ai_voice_surfaces", value: JSON.stringify(cached) })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ key: "ai_voice_surface_prompt_hash", value: TEST_PROMPT_HASH });

    const response = await GET();
    const data = await response.json();

    expect(generateVoiceSurfacesMock).not.toHaveBeenCalled();
    expect(data["greeting.home"]).toBe("Cached greeting!");
  });

  // AC-TST-3: default examples fallback
  it("passes DEFAULT_VOICE_EXAMPLES to generateVoiceSurfaces when no stored examples", async () => {
    // No cached surfaces, no stored examples (both findUnique return null)
    siteSettingsFindUniqueMock.mockResolvedValue(null);

    await GET();

    expect(generateVoiceSurfacesMock).toHaveBeenCalledWith(DEFAULT_VOICE_EXAMPLES);
  });

  // AC-TST-4: AI not configured
  it("returns DEFAULT_VOICE_SURFACES and skips upsert when AI not configured", async () => {
    isAIConfiguredMock.mockResolvedValue(false);
    siteSettingsFindUniqueMock.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(DEFAULT_VOICE_SURFACES);
    expect(siteSettingsUpsertMock).not.toHaveBeenCalled();
    expect(generateVoiceSurfacesMock).not.toHaveBeenCalled();
  });

  // Iter-7 AC-TST-6: prompt hash invalidation — stale hash triggers regen
  it("regenerates surfaces when stored prompt hash differs from current hash", async () => {
    const cached = { ...DEFAULT_VOICE_SURFACES, "greeting.home": "Stale greeting!" };
    // Surfaces exist, examples null, hash is STALE (different from current)
    siteSettingsFindUniqueMock
      .mockResolvedValueOnce({ key: "ai_voice_surfaces", value: JSON.stringify(cached) })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ key: "ai_voice_surface_prompt_hash", value: "old-stale-hash" });

    const response = await GET();
    const data = await response.json();

    // Should have called generate because hash mismatch
    expect(generateVoiceSurfacesMock).toHaveBeenCalledTimes(1);
    // Should NOT return the stale cached greeting
    expect(data["greeting.home"]).toBe(DEFAULT_VOICE_SURFACES["greeting.home"]);
  });
});
