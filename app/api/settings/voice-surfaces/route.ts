import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_VOICE_SURFACES } from "@/lib/ai/voice-surfaces";

/**
 * GET /api/settings/voice-surfaces
 * Returns cached voice surface strings for the ChatPanel.
 * Public — no auth required. Falls back to defaults when none cached.
 */
export async function GET() {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: "ai_voice_surfaces" },
    });

    if (setting?.value) {
      try {
        const surfaces = JSON.parse(setting.value) as Record<string, string>;
        return NextResponse.json(surfaces);
      } catch {
        // Malformed JSON — fall through to defaults
      }
    }

    return NextResponse.json(DEFAULT_VOICE_SURFACES);
  } catch (error) {
    console.error("Error fetching voice surfaces:", error);
    return NextResponse.json(DEFAULT_VOICE_SURFACES);
  }
}
