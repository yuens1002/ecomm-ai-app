"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * SessionProvider wrapper component
 *
 * Wraps the app in NextAuth's SessionProvider to enable useSession hook
 * Must be a client component
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
