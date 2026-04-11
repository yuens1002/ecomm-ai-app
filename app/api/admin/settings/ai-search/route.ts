import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: "ai_voice_persona" },
    });

    return NextResponse.json({
      aiVoicePersona: setting?.value ?? "",
    });
  } catch (err) {
    console.error("Error fetching AI search settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

const schema = z.object({
  aiVoicePersona: z.string().max(2000),
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

    await prisma.siteSettings.upsert({
      where: { key: "ai_voice_persona" },
      update: { value: parsed.data.aiVoicePersona },
      create: { key: "ai_voice_persona", value: parsed.data.aiVoicePersona },
    });

    return NextResponse.json({ aiVoicePersona: parsed.data.aiVoicePersona });
  } catch (err) {
    console.error("Error updating AI search settings:", err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
