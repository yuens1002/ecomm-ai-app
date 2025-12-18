"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  signInAction: (
    prevState: unknown,
    formData: FormData
  ) => Promise<{ message: string; email?: string }>;
}

export function LoginForm({ signInAction }: LoginFormProps) {
  const [state, action, isPending] = useActionState(signInAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action}>
      <FieldGroup>
        <Field>
          <FormHeading
            htmlFor="email"
            label="Email"
            errorMessage={state?.message}
            validationType={state?.message ? "error" : undefined}
          />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            disabled={isPending}
            defaultValue={state?.email || ""}
          />
        </Field>

        <Field>
          <FormHeading
            htmlFor="password"
            label="Password"
            errorMessage={state?.message}
            validationType={state?.message ? "error" : undefined}
            action={
              <Button
                variant="link"
                className="text-sm text-muted-foreground hover:text-primary transition-colors p-0 h-0"
                asChild
                disabled={isPending}
              >
                <Link href="/forgot-password">Forgot your password?</Link>
              </Button>
            }
          />
          <InputGroup>
            <InputGroupInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={isPending}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                disabled={isPending}
                size="icon-xs"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Field className="mt-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
