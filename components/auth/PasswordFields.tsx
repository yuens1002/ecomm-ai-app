"use client";

import { useEffect, useState } from "react";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { Field } from "@/components/ui/field";
import { CheckCircle, Circle } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

// Password strength requirements
const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", pattern: /.{8,}/ },
  { id: "uppercase", label: "At least one uppercase letter", pattern: /[A-Z]/ },
  { id: "lowercase", label: "At least one lowercase letter", pattern: /[a-z]/ },
  { id: "number", label: "At least one number", pattern: /\d/ },
  {
    id: "special",
    label: "At least one special character (!@#$%^&*)",
    pattern: /[!@#$%^&*]/,
  },
  { id: "no-spaces", label: "No spaces", pattern: /^\S+$/ },
];

interface PasswordFieldsProps {
  /** Controlled password value */
  password: string;
  /** Controlled confirm password value */
  confirmPassword: string;
  /** Callback when password changes */
  onPasswordChange: (value: string) => void;
  /** Callback when confirm password changes */
  onConfirmPasswordChange: (value: string) => void;
  /** Whether fields are disabled (e.g., during form submission) */
  disabled?: boolean;
  /** Server-side error for password field */
  passwordError?: string;
  /** Server-side error for confirm password field */
  confirmPasswordError?: string;
  /** Label for password field (default: "New Password") */
  passwordLabel?: string;
  /** Label for confirm field (default: "Confirm New Password") */
  confirmLabel?: string;
  /** Name attribute for password field (default: "password") */
  passwordName?: string;
  /** Name attribute for confirm field (default: "confirmPassword") */
  confirmName?: string;
  /** ID for password field (default: "password") */
  passwordId?: string;
  /** ID for confirm field (default: "confirmPassword") */
  confirmId?: string;
  /** Placeholder for password field */
  passwordPlaceholder?: string;
  /** Placeholder for confirm field */
  confirmPlaceholder?: string;
  /** Whether to show password requirements list (default: true) */
  showRequirements?: boolean;
  /** Expose validation state to parent */
  onValidationChange?: (isValid: boolean) => void;
}

export function PasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  disabled = false,
  passwordError,
  confirmPasswordError,
  passwordLabel = "New Password",
  confirmLabel = "Confirm New Password",
  passwordName = "password",
  confirmName = "confirmPassword",
  passwordId = "password",
  confirmId = "confirmPassword",
  passwordPlaceholder = "Enter new password",
  confirmPlaceholder = "Re-enter new password",
  showRequirements = true,
  onValidationChange,
}: PasswordFieldsProps) {
  const [confirmTouched, setConfirmTouched] = useState(false);

  // Reset touched state when confirm input is cleared (derived from state, not effect)
  const shouldResetTouched = confirmTouched && confirmPassword.length === 0;
  const effectiveConfirmTouched = shouldResetTouched ? false : confirmTouched;

  // Calculate which rules are met
  const rulesStatus = PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: password.length > 0 && rule.pattern.test(password),
  }));

  const allRulesMet = rulesStatus.every((r) => r.met);
  const confirmMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    allRulesMet;

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(passwordsMatch);
    }
  }, [passwordsMatch, onValidationChange]);

  return (
    <>
      <Field>
        <FormHeading
          htmlFor={passwordId}
          label={passwordLabel}
          required
          errorMessage={passwordError}
          validationType={passwordError ? "error" : undefined}
        />
        <InputGroup>
          <InputGroupInput
            id={passwordId}
            name={passwordName}
            type="text"
            placeholder={passwordPlaceholder}
            required
            disabled={disabled}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          <InputGroupAddon align="inline-end" aria-hidden className="pr-3">
            {allRulesMet ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <FormHeading
          htmlFor={confirmId}
          label={confirmLabel}
          required
          errorMessage={
            effectiveConfirmTouched && confirmMismatch
              ? "password should match"
              : confirmPasswordError
          }
          validationType={
            (effectiveConfirmTouched && confirmMismatch) || confirmPasswordError
              ? "error"
              : undefined
          }
        />
        <InputGroup>
          <InputGroupInput
            id={confirmId}
            name={confirmName}
            type="text"
            placeholder={confirmPlaceholder}
            required
            disabled={disabled}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
          />
          <InputGroupAddon align="inline-end" aria-hidden className="pr-3">
            {passwordsMatch ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {showRequirements && (
        <div className="bg-muted/50 rounded-md p-3 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Password must contain:
          </p>
          <div className="space-y-1.5">
            {rulesStatus.map((rule) => (
              <div
                key={rule.id}
                className={`text-sm flex items-center gap-2 ${
                  rule.met
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              >
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  {rule.met ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </span>
                {rule.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
