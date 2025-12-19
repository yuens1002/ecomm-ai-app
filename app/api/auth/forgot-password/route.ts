import { NextRequest, NextResponse } from "next/server";
import { z, ZodIssue } from "zod";
import { requestPasswordReset } from "@/lib/password-reset";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues
        .map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { email } = parsed.data;

    await requestPasswordReset(email);

    return NextResponse.json({
      message: "If that email exists, we sent reset instructions.",
    });
  } catch (error) {
    console.error("forgot-password error", error);
    return NextResponse.json(
      { error: "Unable to process request" },
      { status: 500 }
    );
  }
}
