"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { DemoSignInButtons } from "@/components/auth/DemoSignInButtons";
import { signInAdmin } from "@/app/auth/actions";
import Link from "next/link";
import { IS_DEMO } from "@/lib/demo";

export function AdminSignInContent() {
  // Demo build: one-click sign-in only — no email form
  if (IS_DEMO) {
    return (
      <>
        <DemoSignInButtons />
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &larr; Back to Store
          </Link>
        </div>
      </>
    );
  }

  // Live build: email form only — no demo buttons
  return (
    <>
      <LoginForm signInAction={signInAdmin} />
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          &larr; Back to Store
        </Link>
      </div>
    </>
  );
}
