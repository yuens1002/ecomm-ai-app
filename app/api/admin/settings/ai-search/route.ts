import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { DEFAULT_VOICE_EXAMPLES, type VoiceExample } from "@/lib/ai/voice-examples";
import { generateVoiceSurfaces } from "@/lib/ai/voice-surfaces";
import { isAIConfigured } from "@/lib/ai-client";

export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: [
            "ai_voice_persona",
            "ai_voice_examples",
            "ai_voice_surfaces",
            "ai_smart_search_enabled",
          ],
        },
      },
    });

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    let voiceExamples: VoiceExample[] = [];
    if (map.ai_voice_examples) {
      try {
        voiceExamples = JSON.parse(map.ai_voice_examples) as VoiceExample[];
      } catch {
        // Ignore malformed JSON — fall back to empty
      }
    }

    let voiceSurfaces = null;
    if (map.ai_voice_surfaces) {
      try {
        voiceSurfaces = JSON.parse(map.ai_voice_surfaces) as Record<
          string,
          string
        >;
      } catch {
        // Ignore malformed JSON
      }
    }

    // smartSearchEnabled defaults to true when unset
    const smartSearchEnabled =
      map.ai_smart_search_enabled != null
        ? map.ai_smart_search_enabled !== "false"
        : true;

    return NextResponse.json({
      aiVoicePersona: map.ai_voice_persona ?? "",
      voiceExamples,
      voiceSurfaces,
      smartSearchEnabled,
    });
  } catch (err) {
    console.error("Error fetching AI search settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

const voiceExampleSchema = z.object({
  question: z.string(),
  answer: z.string().max(1000),
});

const schema = z.object({
  aiVoicePersona: z.string().max(2000).optional(),
  voiceExamples: z.array(voiceExampleSchema).max(5).optional(),
  smartSearchEnabled: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 }
      );
    }

    const upserts: Promise<unknown>[] = [];

    if (parsed.data.aiVoicePersona !== undefined) {
      upserts.push(
        prisma.siteSettings.upsert({
          where: { key: "ai_voice_persona" },
          update: { value: parsed.data.aiVoicePersona },
          create: { key: "ai_voice_persona", value: parsed.data.aiVoicePersona },
        })
      );
    }

    if (parsed.data.voiceExamples !== undefined) {
      const json = JSON.stringify(parsed.data.voiceExamples);
      upserts.push(
        prisma.siteSettings.upsert({
          where: { key: "ai_voice_examples" },
          update: { value: json },
          create: { key: "ai_voice_examples", value: json },
        })
      );
    }

    if (parsed.data.smartSearchEnabled !== undefined) {
      const value = String(parsed.data.smartSearchEnabled);
      upserts.push(
        prisma.siteSettings.upsert({
          where: { key: "ai_smart_search_enabled" },
          update: { value },
          create: { key: "ai_smart_search_enabled", value },
        })
      );
    }

    await Promise.all(upserts);

    // When voice examples change, regenerate surface strings in the background
    let voiceSurfaces = null;
    if (parsed.data.voiceExamples !== undefined && (await isAIConfigured())) {
      try {
        const examples =
          parsed.data.voiceExamples.length > 0
            ? parsed.data.voiceExamples
            : DEFAULT_VOICE_EXAMPLES;
        voiceSurfaces = await generateVoiceSurfaces(examples);
        const surfacesJson = JSON.stringify(voiceSurfaces);
        await prisma.siteSettings.upsert({
          where: { key: "ai_voice_surfaces" },
          update: { value: surfacesJson },
          create: { key: "ai_voice_surfaces", value: surfacesJson },
        });
      } catch (err) {
        console.error("Failed to generate voice surfaces:", err);
        // Non-fatal — voice examples still saved
      }
    }

    return NextResponse.json({
      aiVoicePersona: parsed.data.aiVoicePersona,
      voiceExamples: parsed.data.voiceExamples,
      voiceSurfaces,
    });
  } catch (err) {
    console.error("Error updating AI search settings:", err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
