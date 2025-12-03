"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "./use-toast";

/**
 * Simple validation hook for form dialogs.
 *
 * Features:
 * - Centralized error state management
 * - Error toast on validation failure
 * - `hasErrors` for disabling save button
 * - Field-level error clearing on edit
 *
 * @example
 * ```tsx
 * const { errors, hasErrors, setErrors, clearError, showValidationError } = useValidation<{
 *   title?: string;
 *   imageUrl?: string;
 * }>();
 *
 * const handleSave = async () => {
 *   const fieldErrors: typeof errors = {};
 *   if (!title.trim()) fieldErrors.title = "Title is required";
 *   if (!imageUrl && !pendingFile) fieldErrors.imageUrl = "Image is required";
 *
 *   if (Object.keys(fieldErrors).length > 0) {
 *     showValidationError(fieldErrors);
 *     return;
 *   }
 *   // ... save logic
 * };
 *
 * <Button onClick={handleSave} disabled={hasErrors}>Save</Button>
 * ```
 */
export function useValidation<T extends Record<string, string | undefined>>() {
  const [errors, setErrorsState] = useState<T>({} as T);

  const hasErrors = useMemo(
    () => Object.values(errors).some((v) => v !== undefined),
    [errors]
  );

  const setErrors = useCallback((newErrors: T) => {
    setErrorsState(newErrors);
  }, []);

  const setError = useCallback((field: keyof T, message: string) => {
    setErrorsState((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrorsState((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrorsState({} as T);
  }, []);

  /**
   * Set errors and show toast notification.
   * Returns false if there are errors, true if no errors.
   */
  const showValidationError = useCallback(
    (
      fieldErrors: T,
      toastTitle = "Unable to save",
      toastDescription = "Please fix the errors and try again"
    ): boolean => {
      const hasFieldErrors = Object.values(fieldErrors).some(
        (v) => v !== undefined
      );

      setErrorsState(fieldErrors);

      if (hasFieldErrors) {
        toast({
          variant: "destructive",
          title: toastTitle,
          description: toastDescription,
        });
        return false;
      }

      return true;
    },
    []
  );

  return {
    errors,
    hasErrors,
    setErrors,
    setError,
    clearError,
    clearAllErrors,
    showValidationError,
  };
}

// Type helper for common block validation errors
export type BlockValidationErrors = {
  [key: string]: string | undefined;
};
