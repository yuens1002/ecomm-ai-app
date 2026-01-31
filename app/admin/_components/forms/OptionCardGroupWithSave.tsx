"use client";

import { ReactNode } from "react";
import { SaveButton } from "@/app/admin/_components/forms/SaveButton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export interface OptionCard {
  value: string;
  title: string;
  description?: string;
  /** Optional custom content rendered under the title/description (e.g., badges). */
  hint?: ReactNode;
  /** Disable selecting this option. */
  disabled?: boolean;
}

interface OptionCardGroupWithSaveProps {
  options: OptionCard[];
  value: string;
  onValueChange: (next: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  className?: string;
  saveLabel?: string;
  /** Place button at start for vertical stacking on narrow layouts if desired. */
  buttonPlacement?: "start" | "end";
}

/**
 * A shadcn-aligned layout for radio option cards with a trailing Save button.
 * Keeps Save focusable when "disabled" so keyboard users can still tab to it.
 */
export function OptionCardGroupWithSave({
  options,
  value,
  onValueChange,
  onSave,
  isSaving = false,
  isDirty = false,
  className,
  saveLabel = "Save",
  buttonPlacement = "end",
}: OptionCardGroupWithSaveProps) {
  const saveDisabled = isSaving || !isDirty;

  const ButtonEl = (
    <SaveButton
      size="sm"
      variant="secondary"
      onClick={onSave}
      disabled={saveDisabled}
      focusableWhenDisabled
      label={saveLabel}
      savingLabel="Saving"
      isSaving={isSaving}
      className="shrink-0"
    />
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      {buttonPlacement === "start" && ButtonEl}
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        className="flex-1 space-y-3"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "block p-4 rounded-md border transition-colors",
              "hover:bg-accent/30",
              "data-[state=checked]:border-primary data-[state=checked]:bg-primary/5",
              option.disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem
                value={option.value}
                id={`option-${option.value}`}
                className="mt-1"
                disabled={option.disabled}
              />
              <div className="space-y-1">
                <p className="font-medium">{option.title}</p>
                {option.description ? (
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                ) : null}
                {option.hint}
              </div>
            </div>
          </label>
        ))}
      </RadioGroup>
      {buttonPlacement === "end" && ButtonEl}
    </div>
  );
}
