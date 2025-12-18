import { NextRequest, NextResponse } from "next/server";
import { z, ZodIssue } from "zod";
import { resetPasswordWithToken } from "@/lib/password-reset";

const resetSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues
        .map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const result = await resetPasswordWithToken(token, password);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("reset-password error", error);
    return NextResponse.json(
      { error: "Unable to reset password" },
      { status: 500 }
    );
  }
}
