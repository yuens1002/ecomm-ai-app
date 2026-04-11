import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import type { VoiceExample } from "@/lib/ai/voice-examples";

export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: ["ai_voice_persona", "ai_voice_examples"] } },
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

    return NextResponse.json({
      aiVoicePersona: map.ai_voice_persona ?? "",
      voiceExamples,
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

    await Promise.all(upserts);

    return NextResponse.json({
      aiVoicePersona: parsed.data.aiVoicePersona,
      voiceExamples: parsed.data.voiceExamples,
    });
  } catch (err) {
    console.error("Error updating AI search settings:", err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
