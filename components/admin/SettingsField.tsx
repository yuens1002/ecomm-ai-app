"use client";

import { useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { Field, FieldDescription } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { FormInputField } from "@/components/ui/app/FormInputField";
import { useToast } from "@/hooks/use-toast";
import { InputGroupInput } from "@/components/ui/app/InputGroup";

interface SettingsFieldProps<T = string> {
  /** API endpoint to fetch/save (e.g., "/api/admin/settings/branding") */
  endpoint: string;
  /** Field name in the settings object */
  field: string;
  /** Label for the field */
  label: string;
  /** Description shown below the input */
  description?: string;
  /** HTTP method for saving (default: PUT) */
  method?: "PUT" | "PATCH" | "POST";
  /** Custom input component - receives value, onChange, isDirty, isSaving, and onSave */
  input?: (
    value: T,
    onChange: (value: T) => void,
    isDirty: boolean,
    isSaving?: boolean,
    onSave?: () => void
  ) => ReactNode;
  /** Transform value before saving (e.g., for nested objects) */
  transformSave?: (
    value: T,
    allSettings: Record<string, unknown>
  ) => Record<string, unknown>;
  /** Transform value after loading */
  transformLoad?: (data: Record<string, unknown>) => T;
  /** Default value if not loaded */
  defaultValue?: T;
  /** Automatically save when value changes (e.g., toggles) */
  autoSave?: boolean;
  /** Optional max length to enforce and show counter for string inputs */
  maxLength?: number;
  /** Show character counter when maxLength is provided (default: true) */
  showCharCount?: boolean;
  /** Hide external Save button if input handles its own (default: false) */
  saveButtonInInput?: boolean;
}

/**
 * Reusable settings field component
 * Handles fetch, state, dirty tracking, and save automatically
 *
 * Usage:
 * <SettingsField
 *   endpoint="/api/admin/settings/branding"
 *   field="storeName"
 *   label="Store Name"
 *   description="Shown in header, footer, emails"
 * />
 *
 * Custom input:
 * <SettingsField
 *   endpoint="/api/admin/settings/product-menu"
 *   field="icon"
 *   label="Menu Icon"
 *   input={(value, onChange) => (
 *     <IconPicker value={value} onValueChange={onChange} />
 *   )}
 * />
 *
 * With FormTextArea:
 * <SettingsField
 *   endpoint="/api/admin/settings/branding"
 *   field="storeDescription"
 *   label="Store Description"
 *   maxLength={280}
 *   saveButtonInInput
 *   input={(value, onChange, isDirty, isSaving, onSave) => (
 *     <FormTextArea
 *       value={value}
 *       onChange={e => onChange(e.target.value)}
 *       maxLength={280}
 *       currentLength={value.length}
 *       showSaveButton
 *       isSaving={isSaving}
 *       isSaveDisabled={!isDirty}
 *       onSave={onSave}
 *     />
 *   )}
 * />
 */
export function SettingsField<T = string>({
  endpoint,
  field,
  label,
  description,
  method = "PUT",
  input,
  transformSave,
  transformLoad,
  defaultValue = "" as T,
  autoSave = false,
  maxLength,
  showCharCount = true,
  saveButtonInInput = false,
}: SettingsFieldProps<T>) {
  const { toast } = useToast();
  const [value, setValue] = useState<T>(defaultValue);
  const [originalValue, setOriginalValue] = useState<T>(defaultValue);
  const [allSettings, setAllSettings] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedValueRef = useRef<T>(defaultValue);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error("Failed to load settings");

        const data = await response.json();
        setAllSettings(data);

        const loadedValue = transformLoad
          ? transformLoad(data)
          : (data[field] as T);
        setValue(loadedValue);
        setOriginalValue(loadedValue);
        lastSavedValueRef.current = loadedValue;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [endpoint, field, transformLoad, toast]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const body = transformSave
        ? transformSave(value, allSettings)
        : { ...allSettings, [field]: value };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });

      setOriginalValue(value);
      lastSavedValueRef.current = value;
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [allSettings, endpoint, field, method, toast, transformSave, value]);

  useEffect(() => {
    if (!autoSave) return;
    if (isLoading) return;
    // Skip if value hasn't changed since loaded
    if (value === originalValue) return;

    const timer = setTimeout(() => {
      void handleSave();
    }, 400);

    return () => clearTimeout(timer);
    // Only trigger on value or autoSave change, not isSaving or originalValue
  }, [autoSave, handleSave, isLoading, originalValue, value]);

  const isDirty = value !== originalValue;
  const isString = typeof value === "string";
  const currentLength = isString
    ? ((value as unknown as string)?.length ?? 0)
    : 0;

  if (isLoading) {
    return (
      <Field>
        <FormHeading label={label} />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 bg-muted animate-pulse rounded-md" />
          <div className="w-20 h-10 bg-muted animate-pulse rounded-md" />
        </div>
      </Field>
    );
  }

  return (
    <Field>
      <FormHeading htmlFor={`field-${field}`} label={label} isDirty={isDirty} />
      {input && (saveButtonInInput || autoSave) ? (
        // Custom input that handles its own layout (e.g., FormTextArea with Save button or autoSave selectors)
        input(value, setValue, isDirty, isSaving, handleSave)
      ) : (
        <FormInputField
          maxLength={maxLength}
          showCharCount={showCharCount}
          currentLength={currentLength}
          showSaveButton={!autoSave && !saveButtonInInput}
          isSaving={isSaving}
          isSaveDisabled={!isDirty}
          onSave={handleSave}
        >
          {input ? (
            input(value, setValue, isDirty, isSaving, handleSave)
          ) : (
            <InputGroupInput
              id={`field-${field}`}
              value={value as string}
              onChange={(e) => setValue(e.target.value as T)}
              maxLength={maxLength}
              className={isDirty ? "border-amber-500" : ""}
            />
          )}
        </FormInputField>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}
