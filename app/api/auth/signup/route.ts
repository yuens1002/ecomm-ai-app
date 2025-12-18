import { NextResponse } from "next/server";
import { z, ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, isStrongPassword } from "@/lib/password";

const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues
        .map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { email, password, name } = parsed.data;

    // Check password strength
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "Password must meet complexity requirements" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: hashedPassword,
      },
    });

    // Return success (don't send password hash!)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
