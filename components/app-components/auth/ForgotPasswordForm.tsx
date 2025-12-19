"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Field, FieldGroup } from "@/components/ui/field";
import Link from "next/link";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface ForgotPasswordFormProps {
  requestPasswordResetAction: (
    prevState: unknown,
    formData: FormData
  ) => Promise<{ ok?: boolean; error?: string; message?: string }>;
  returnTo?: string;
}

export function ForgotPasswordForm({
  requestPasswordResetAction,
  returnTo = "/auth/signin",
}: ForgotPasswordFormProps) {
  const [state, action, isPending] = useActionState(
    requestPasswordResetAction,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <FieldGroup>
        <Field>
          <FormHeading
            htmlFor="email"
            label="Email Address"
            errorMessage={state?.error}
            validationType={state?.error ? "error" : undefined}
          />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            disabled={isPending}
            autoComplete="email"
          />
        </Field>
      </FieldGroup>

      {state?.ok && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm text-green-900 dark:text-green-100 flex items-start gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>Email sent, check your email for the reset password link.</span>
        </div>
      )}

      {state?.error && !state?.ok && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-900 dark:text-red-100 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>Something went wrong, please try again.</span>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Sending...
          </>
        ) : (
          "Send Password Reset Link"
        )}
      </Button>

      <div className="text-center text-sm">
        <Link href={returnTo} className="text-primary hover:underline">
          &larr; Back to Sign In
        </Link>
      </div>
    </form>
  );
}
