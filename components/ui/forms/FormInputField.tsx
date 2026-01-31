"use client";

import { ReactNode, KeyboardEvent } from "react";
import { Loader2, Save } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/forms/InputGroup";

interface FormInputFieldProps {
  /** The input element (InputGroupInput or custom) */
  children: ReactNode;
  /** Optional max length to enforce and show counter */
  maxLength?: number;
  /** Show character counter when maxLength is provided (default: true) */
  showCharCount?: boolean;
  /** Current character length (only needed if showCharCount is true) */
  currentLength?: number;
  /** Optional className for the InputGroup wrapper */
  className?: string;
  /** Show Save button (default: false) */
  showSaveButton?: boolean;
  /** Save button loading state */
  isSaving?: boolean;
  /** Save button disabled state */
  isSaveDisabled?: boolean;
  /** Callback when Save button is clicked or Enter is pressed */
  onSave?: () => void;
}

/**
 * FormInputField wraps an input within an InputGroup with optional character counter and Save button.
 * Character count and Save button appear at the inline-end addon.
 * Supports Enter key to trigger save.
 *
 * Usage:
 * <FormInputField maxLength={60} currentLength={value.length}>
 *   <InputGroupInput value={value} onChange={e => setValue(e.target.value)} />
 * </FormInputField>
 *
 * With Save button:
 * <FormInputField
 *   maxLength={60}
 *   currentLength={value.length}
 *   showSaveButton
 *   isSaving={isSaving}
 *   isSaveDisabled={!isDirty}
 *   onSave={handleSave}
 * >
 *   <InputGroupInput value={value} onChange={e => setValue(e.target.value)} />
 * </FormInputField>
 */
export function FormInputField({
  children,
  maxLength,
  showCharCount = true,
  currentLength = 0,
  className,
  showSaveButton = false,
  isSaving = false,
  isSaveDisabled = false,
  onSave,
}: FormInputFieldProps) {
  const charCountEnabled = showCharCount && typeof maxLength === "number";

  const isAriaDisabled = isSaveDisabled || isSaving;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    if (!showSaveButton || isAriaDisabled || !onSave) return;
    e.preventDefault();
    onSave();
  };

  return (
    <InputGroup
      className={`md:max-w-[72ch] lg:max-w-[72ch] xl:max-w-[72ch] ${className || ""}`}
      onKeyDown={handleKeyDown}
    >
      {children}
      {(charCountEnabled || showSaveButton) && (
        <InputGroupAddon align="inline-end" className="items-center">
          {charCountEnabled && (
            <span className="text-xs font-medium text-muted-foreground">
              {currentLength}/{maxLength}
            </span>
          )}
          {showSaveButton && (
            <InputGroupButton
              onClick={(e) => {
                if (isAriaDisabled) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                onSave?.();
              }}
              aria-disabled={isAriaDisabled}
              data-disabled={isAriaDisabled ? "true" : undefined}
              className="ml-auto data-[disabled=true]:opacity-60 data-[disabled=true]:cursor-not-allowed"
              size="sm"
              variant="default"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Save</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="ml-2">Save</span>
                </>
              )}
            </InputGroupButton>
          )}
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
