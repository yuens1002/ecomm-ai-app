import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin";
import { chatCompletion } from "@/lib/ai-client";

const schema = z.object({
  rawPersona: z.string().min(1, "Persona text is required").max(2000),
});

export async function POST(request: NextRequest) {
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

    const result = await chatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You are an expert at writing AI assistant personas for specialty coffee shops. Rewrite the shop owner's description as a first-person instruction set that captures their tone, knowledge, and personality — written from the perspective of an AI assistant that will speak in their voice. Keep it warm, specific, and genuine. Return only the rewritten persona, no preamble.",
        },
        {
          role: "user",
          content: parsed.data.rawPersona,
        },
      ],
      maxTokens: 600,
      temperature: 0.7,
    });

    return NextResponse.json({ reframedPersona: result.text.trim() });
  } catch (err) {
    console.error("Error reframing voice persona:", err);
    return NextResponse.json(
      { error: "Failed to reframe persona" },
      { status: 500 }
    );
  }
}
