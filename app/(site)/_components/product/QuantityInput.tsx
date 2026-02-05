"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface QuantityInputProps {
  /** Current quantity value */
  value: number;
  /** Minimum allowed value (default: 1) */
  min?: number;
  /** Maximum allowed value (default: 99) */
  max?: number;
  /** Callback when quantity changes */
  onChange: (quantity: number) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Label prefix (default: "Qty") */
  label?: string;
  /** Show label (default: true) */
  showLabel?: boolean;
}

/**
 * Compact numeric input for quantity selection.
 *
 * Features:
 * - Direct number input (no +/- buttons)
 * - Min/max validation with clamping on blur
 * - Matches height of existing UI elements (h-14)
 * - Hidden browser spinners for clean look
 *
 * @example
 * ```tsx
 * <QuantityInput
 *   value={quantity}
 *   min={1}
 *   max={stockQuantity}
 *   onChange={setQuantity}
 * />
 * ```
 */
export function QuantityInput({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  className,
  label = "Qty",
  showLabel = true,
}: QuantityInputProps) {
  // Local state for controlled input (allows empty string while typing)
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when prop changes (but not during user input)
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  /**
   * Clamp value to min/max bounds
   */
  const clampValue = useCallback(
    (val: number): number => {
      return Math.min(Math.max(val, min), max);
    },
    [min, max]
  );

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty string while typing
      if (inputValue === "") {
        setLocalValue("");
        return;
      }

      // Only allow digits
      if (!/^\d*$/.test(inputValue)) {
        return;
      }

      setLocalValue(inputValue);

      // Parse and update if valid
      const numValue = parseInt(inputValue, 10);
      if (!isNaN(numValue) && numValue >= min && numValue <= max) {
        onChange(numValue);
      }
    },
    [min, max, onChange]
  );

  /**
   * Handle blur - clamp and finalize value
   */
  const handleBlur = useCallback(() => {
    const numValue = parseInt(localValue, 10);

    if (isNaN(numValue) || localValue === "") {
      // Reset to current value if empty/invalid
      setLocalValue(String(value));
    } else {
      // Clamp to bounds
      const clampedValue = clampValue(numValue);
      setLocalValue(String(clampedValue));
      if (clampedValue !== value) {
        onChange(clampedValue);
      }
    }
  }, [localValue, value, clampValue, onChange]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const newValue = clampValue(value + 1);
        if (newValue !== value) {
          onChange(newValue);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const newValue = clampValue(value - 1);
        if (newValue !== value) {
          onChange(newValue);
        }
      } else if (e.key === "Enter") {
        inputRef.current?.blur();
      }
    },
    [value, clampValue, onChange]
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-14 px-3 rounded-md border border-border bg-muted/60",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {showLabel && (
        <label
          htmlFor="quantity-input"
          className="text-sm font-medium text-muted-foreground select-none"
        >
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id="quantity-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={`Quantity, minimum ${min}, maximum ${max}`}
        className={cn(
          "w-12 h-10 text-center text-base font-semibold",
          "bg-background border border-border rounded-md",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Hide browser spinners
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        )}
      />
    </div>
  );
}
