import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_VOICE_SURFACES } from "@/lib/ai/voice-surfaces";
import { DEFAULT_VOICE_EXAMPLES } from "@/lib/ai/voice-examples";
import { generateVoiceSurfaces, SURFACE_PROMPT_HASH } from "@/lib/ai/voice-surfaces.server";
import { isAIConfigured } from "@/lib/ai-client";

/**
 * GET /api/settings/voice-surfaces
 * Returns voice surface strings for the ChatPanel.
 * Public — no auth required.
 *
 * Lazy initialization: on first Counter open (when no surfaces are cached in DB),
 * generates surfaces from stored voice examples (or defaults) and caches the result.
 * Every subsequent open returns the cached value — no AI call per page load.
 * Cache is busted (deleted) by PUT /api/admin/settings/ai-search when examples change.
 *
 * Prompt hash invalidation: if the generation prompt template changed since the last
 * surface generation (deploy-time code change), cached surfaces are auto-regenerated.
 */
export async function GET() {
  try {
    const [surfacesSetting, examplesSetting, hashSetting] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { key: "ai_voice_surfaces" } }),
      prisma.siteSettings.findUnique({ where: { key: "ai_voice_examples" } }),
      prisma.siteSettings.findUnique({ where: { key: "ai_voice_surface_prompt_hash" } }),
    ]);

    const storedHash = hashSetting?.value ?? null;
    const hashMismatch = storedHash !== SURFACE_PROMPT_HASH;

    // Cached path — return stored surfaces if prompt hash matches
    if (surfacesSetting?.value && !hashMismatch) {
      try {
        const surfaces = JSON.parse(surfacesSetting.value) as Record<string, string>;
        return NextResponse.json(surfaces);
      } catch {
        // Malformed JSON — fall through to init
      }
    }

    // No surfaces cached, or prompt hash changed — (re)generate if AI is available
    if (await isAIConfigured()) {
      let examples = DEFAULT_VOICE_EXAMPLES;
      if (examplesSetting?.value) {
        try {
          examples = JSON.parse(examplesSetting.value);
        } catch {
          // Malformed — use defaults
        }
      }
      const surfaces = await generateVoiceSurfaces(examples);
      await Promise.all([
        prisma.siteSettings.upsert({
          where: { key: "ai_voice_surfaces" },
          update: { value: JSON.stringify(surfaces) },
          create: { key: "ai_voice_surfaces", value: JSON.stringify(surfaces) },
        }),
        prisma.siteSettings.upsert({
          where: { key: "ai_voice_surface_prompt_hash" },
          update: { value: SURFACE_PROMPT_HASH },
          create: { key: "ai_voice_surface_prompt_hash", value: SURFACE_PROMPT_HASH },
        }),
      ]);
      return NextResponse.json(surfaces);
    }

    // AI not configured — return TS defaults so the Counter still renders
    return NextResponse.json(DEFAULT_VOICE_SURFACES);
  } catch (error) {
    console.error("Error fetching voice surfaces:", error);
    return NextResponse.json(DEFAULT_VOICE_SURFACES);
  }
}
