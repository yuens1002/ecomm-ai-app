"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

interface SaveButtonProps
  extends Omit<ComponentProps<typeof Button>, "children"> {
  isSaving?: boolean;
  label?: string;
  savingLabel?: string;
  showIcon?: boolean;
  iconPosition?: "start" | "end";
  /** Keeps the button focusable while visually disabled. */
  focusableWhenDisabled?: boolean;
}

/**
 * Shared Save button with spinner, icon, and focusable-when-disabled support.
 * Wraps shadcn Button to keep primitive untouched.
 */
export function SaveButton({
  isSaving = false,
  label = "Save",
  savingLabel = "Saving",
  showIcon = true,
  iconPosition = "start",
  disabled,
  className,
  variant = "default",
  size = "sm",
  focusableWhenDisabled,
  ...props
}: SaveButtonProps) {
  const isAriaDisabled = focusableWhenDisabled && (disabled || isSaving);
  const effectiveDisabled = focusableWhenDisabled ? false : disabled;

  const handleClick: ComponentProps<typeof Button>["onClick"] = (event) => {
    if (isAriaDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    props.onClick?.(event);
  };

  const content = (
    <>
      {isSaving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <Save className="h-4 w-4" />
      ) : null}
      <span className={cn(showIcon ? "ml-2" : "")}>
        {isSaving ? savingLabel : label}
      </span>
    </>
  );

  return (
    <Button
      variant={variant}
      size={size}
      disabled={effectiveDisabled || isSaving}
      aria-disabled={isAriaDisabled || props["aria-disabled"]}
      data-disabled={isAriaDisabled ? "true" : undefined}
      className={cn(
        "shrink-0",
        isAriaDisabled &&
          "data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed",
        className
      )}
      {...props}
      onClick={handleClick}
    >
      {iconPosition === "start" ? content : null}
      {iconPosition === "end" ? content : null}
    </Button>
  );
}
