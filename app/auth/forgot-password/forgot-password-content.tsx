"use client";

import { useSearchParams } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { requestPasswordResetAction } from "@/actions/auth";

export function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/auth/signin";

  return (
    <ForgotPasswordForm
      requestPasswordResetAction={requestPasswordResetAction}
      returnTo={returnTo}
    />
  );
}
