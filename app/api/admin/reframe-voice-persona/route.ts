import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin";
import { chatCompletion } from "@/lib/ai-client";

const schema = z.object({
  rawPersona: z.string().min(1, "Persona text is required").max(2000),
});

// Three sample customer questions to preview the persona in action
const PREVIEW_QUESTIONS = [
  "What should I try first?",
  "I love fruity, bright coffees — what do you recommend?",
  "Do you have anything good for a French press?",
];

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

    const { rawPersona } = parsed.data;

    // Generate one AI call with all three Q&A pairs in a single response
    const result = await chatCompletion({
      messages: [
        {
          role: "system",
          content: `You are a specialty coffee shop assistant. Embody this shop owner's voice exactly:\n"${rawPersona}"\n\nSpeak in first person as the shop owner. Be warm, specific, and genuine. Keep each answer to 2–3 sentences.`,
        },
        {
          role: "user",
          content: `Answer each of these customer questions in your voice. Return JSON only — no markdown:\n{\n  "answers": [\n    "answer to: ${PREVIEW_QUESTIONS[0]}",\n    "answer to: ${PREVIEW_QUESTIONS[1]}",\n    "answer to: ${PREVIEW_QUESTIONS[2]}"\n  ]\n}`,
        },
      ],
      maxTokens: 600,
      temperature: 0.7,
    });

    // Strip markdown fences and parse
    const stripped = result.text
      .trim()
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");

    let answers: string[] = [];
    try {
      const parsed = JSON.parse(stripped) as { answers?: unknown };
      if (Array.isArray(parsed.answers)) {
        answers = parsed.answers
          .slice(0, 3)
          .map((a) => (typeof a === "string" ? a.trim() : ""))
          .filter(Boolean);
      }
    } catch {
      // Fallback: split by newlines if JSON parsing fails
      answers = stripped.split(/\n{2,}/).slice(0, 3).map((s) => s.trim()).filter(Boolean);
    }

    const conversations = PREVIEW_QUESTIONS.slice(0, answers.length).map((question, i) => ({
      question,
      answer: answers[i] ?? "",
    }));

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Error generating persona preview:", err);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
