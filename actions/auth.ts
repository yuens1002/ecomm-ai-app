"use server";

import { z, ZodIssue } from "zod";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import {
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/lib/password-reset";
import { isStrongPassword } from "@/lib/password";

// Validation schemas
const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid password"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid token"),
  password: z.string().min(1, "Password is required"),
});

export async function signInAdmin(
  prevState: unknown,
  formData: FormData
): Promise<{ message: string; email?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const validated = credentialsSchema.safeParse({ email, password });
    if (!validated.success) {
      return {
        message: validated.error.issues
          .map((e: ZodIssue) => e.message)
          .join("; "),
        email: String(email || ""),
      };
    }

    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "Invalid credentials", email: String(email || "") };
        default:
          return {
            message: "Something went wrong",
            email: String(email || ""),
          };
      }
    }
    // Next.js redirects are thrown as errors, so we must rethrow them
    throw error;
  }

  return { message: "Something went wrong" };
}

export async function signInPublic(
  prevState: unknown,
  formData: FormData
): Promise<{ message: string; email?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const validated = credentialsSchema.safeParse({ email, password });
    if (!validated.success) {
      return {
        message: validated.error.issues
          .map((e: ZodIssue) => e.message)
          .join("; "),
        email: String(email || ""),
      };
    }

    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/account",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "Invalid credentials", email: String(email || "") };
        default:
          return {
            message: "Something went wrong",
            email: String(email || ""),
          };
      }
    }
    // Next.js redirects are thrown as errors, so we must rethrow them
    throw error;
  }

  return { message: "Something went wrong" };
}

export async function requestPasswordResetAction(
  prevState: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string; message?: string }> {
  try {
    const email = (formData.get("email") as string | null)?.trim() ?? "";

    const validated = forgotPasswordSchema.safeParse({ email });
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues
          .map((e: ZodIssue) => e.message)
          .join("; "),
      };
    }

    await requestPasswordReset(validated.data.email);
    return {
      ok: true,
      message: "If that email exists, we sent reset instructions.",
    };
  } catch (error) {
    console.error("requestPasswordResetAction error:", error);
    return {
      ok: false,
      error: "Unable to process password reset request",
    };
  }
}

export async function resetPasswordWithTokenAction(
  prevState: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string; message?: string }> {
  try {
    const token = (formData.get("token") as string | null)?.trim() ?? "";
    const password = (formData.get("password") as string | null) ?? "";

    const validated = resetPasswordSchema.safeParse({ token, password });
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues
          .map((e: ZodIssue) => e.message)
          .join("; "),
      };
    }

    if (!isStrongPassword(validated.data.password)) {
      return {
        ok: false,
        error: "Password does not meet requirements",
      };
    }

    const result = await resetPasswordWithToken(
      validated.data.token,
      validated.data.password
    );

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }

    return {
      ok: true,
      message: "Password reset successful",
    };
  } catch (error) {
    console.error("resetPasswordWithTokenAction error:", error);
    return {
      ok: false,
      error: "Unable to reset password",
    };
  }
}
