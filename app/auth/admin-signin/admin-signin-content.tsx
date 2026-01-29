"use client";

import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/components/app-components/auth/LoginForm";
import { DemoSignInButtons } from "@/components/app-components/auth/DemoSignInButtons";
import { signInAdmin } from "@/actions/auth";
import Link from "next/link";

export function AdminSignInContent() {
  return (
    <>
      {/* Demo sign-in buttons - only visible when NEXT_PUBLIC_DEMO_MODE=true */}
      <DemoSignInButtons />

      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && <Separator className="my-4" />}

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
