"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FieldGroup } from "@/components/ui/field";
import Link from "next/link";
import { PasswordFields } from "./PasswordFields";

interface ResetPasswordFormProps {
  resetPasswordWithTokenAction: (
    prevState: unknown,
    formData: FormData
  ) => Promise<{
    ok?: boolean;
    error?: string;
    message?: string;
    errors?: { password?: string; confirmPassword?: string };
  }>;
}

export function ResetPasswordForm({
  resetPasswordWithTokenAction,
}: ResetPasswordFormProps) {
  const [state, action, isPending] = useActionState(
    resetPasswordWithTokenAction,
    undefined
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <FieldGroup>
        {/* Hidden token field - will be set from sessionStorage */}
        <input type="hidden" name="token" id="token" />

        <PasswordFields
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          disabled={isPending}
          passwordError={state?.errors?.password || state?.error}
          confirmPasswordError={state?.errors?.confirmPassword}
          onValidationChange={setPasswordsMatch}
        />
      </FieldGroup>

      <Button
        type="submit"
        disabled={false}
        aria-disabled={!passwordsMatch || isPending || undefined}
        data-disabled={!passwordsMatch || isPending ? "true" : undefined}
        onClick={(e) => {
          const isAriaDisabled = !passwordsMatch || isPending;
          if (isAriaDisabled) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="w-full data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Resetting...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>

      <div className="text-center text-sm">
        <Link
          href="/auth/forgot-password"
          className="text-primary hover:underline"
        >
          Request another reset link
        </Link>
      </div>
    </form>
  );
}
