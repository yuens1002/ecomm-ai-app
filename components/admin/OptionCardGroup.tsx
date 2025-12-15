"use client";

import { ReactNode } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export interface OptionCard {
  value: string;
  title: string;
  description?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}

interface OptionCardGroupProps {
  options: OptionCard[];
  value: string;
  onValueChange: (next: string) => void;
  className?: string;
  /** Optional wrapper width constraints to align with form inputs. */
  wrapperClassName?: string;
  disabled?: boolean;
}

/**
 * Styled radio option cards aligned with shadcn primitives.
 * Use when no Save button is required (auto-save flows).
 */
export function OptionCardGroup({
  options,
  value,
  onValueChange,
  className,
  wrapperClassName = "w-full max-w-xl md:max-w-2xl",
  disabled = false,
}: OptionCardGroupProps) {
  return (
    <div
      className={cn(
        wrapperClassName,
        disabled && "opacity-60 cursor-not-allowed"
      )}
      aria-disabled={disabled}
    >
      <RadioGroup
        value={value}
        onValueChange={disabled ? () => {} : onValueChange}
        className={cn(
          // Default vertical stack spacing; callers can override via className
          "!flex !flex-col !gap-2",
          className
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            htmlFor={`option-${option.value}`}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-border p-4",
              "hover:bg-muted/50 cursor-pointer transition-colors",
              "data-[state=checked]:border-primary data-[state=checked]:bg-primary/5",
              option.disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <RadioGroupItem
              value={option.value}
              id={`option-${option.value}`}
              className="mt-1"
              disabled={option.disabled}
            />
            <div className="flex-1 space-y-1">
              <p className="text-base font-medium">{option.title}</p>
              {option.description ? (
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              ) : null}
              {option.hint}
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
