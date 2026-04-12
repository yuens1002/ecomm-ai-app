import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { DEFAULT_VOICE_EXAMPLES, type VoiceExample } from "@/lib/ai/voice-examples";
import { generateVoiceSurfaces } from "@/lib/ai/voice-surfaces.server";
import { isAIConfigured } from "@/lib/ai-client";

export async function POST() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  if (!(await isAIConfigured())) {
    return NextResponse.json(
      { error: "AI provider not configured" },
      { status: 400 }
    );
  }

  try {
    // Read current voice examples from DB
    const setting = await prisma.siteSettings.findUnique({
      where: { key: "ai_voice_examples" },
    });

    let examples: VoiceExample[] = DEFAULT_VOICE_EXAMPLES;
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value) as VoiceExample[];
        if (parsed.length > 0) examples = parsed;
      } catch {
        // Fall back to defaults
      }
    }

    const surfaces = await generateVoiceSurfaces(examples);
    const json = JSON.stringify(surfaces);

    await prisma.siteSettings.upsert({
      where: { key: "ai_voice_surfaces" },
      update: { value: json },
      create: { key: "ai_voice_surfaces", value: json },
    });

    return NextResponse.json({ voiceSurfaces: surfaces });
  } catch (err) {
    console.error("Error regenerating voice surfaces:", err);
    return NextResponse.json(
      { error: "Failed to regenerate surfaces" },
      { status: 500 }
    );
  }
}
