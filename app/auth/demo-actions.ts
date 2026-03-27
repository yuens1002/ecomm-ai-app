"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const DEMO_CREDENTIALS = {
  admin: {
    email: "admin@artisanroast.com",
    password: "ivcF8ZV3FnGaBJ&#8j",
    redirectTo: "/admin",
  },
  customer: {
    email: "demo@artisanroast.com",
    password: "ixcF8ZV3FnGaBJ&#8j",
    redirectTo: "/",
  },
} as const;

type DemoAccountType = keyof typeof DEMO_CREDENTIALS;

export async function demoSignIn(
  accountType: string
): Promise<{ error?: string }> {
  const isDemo =
    process.env.NEXT_PUBLIC_BUILD_VARIANT === "demo" ||
    process.env.NEXT_PUBLIC_BUILD_VARIANT === "DEMO";
  if (!isDemo) {
    return { error: "Demo mode is not enabled" };
  }

  if (accountType !== "admin" && accountType !== "customer") {
    return { error: "Invalid account type" };
  }

  const account = DEMO_CREDENTIALS[accountType as DemoAccountType];

  try {
    await signIn("credentials", {
      email: account.email,
      password: account.password,
      redirectTo: account.redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Demo sign-in failed. Please try again." };
    }
    // Next.js redirects are thrown as errors — rethrow
    throw error;
  }

  return { error: "Something went wrong" };
}
