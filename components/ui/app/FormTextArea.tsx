"use client";

import { Loader2, Save } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
  InputGroupText,
  InputGroupButton,
} from "@/components/ui/app/InputGroup";

interface FormTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Optional max length to enforce and show counter */
  maxLength?: number;
  /** Show character counter when maxLength is provided (default: true) */
  showCharCount?: boolean;
  /** Current character length (only needed if showCharCount is true) */
  currentLength?: number;
  /** Show Save button (default: false) */
  showSaveButton?: boolean;
  /** Save button loading state */
  isSaving?: boolean;
  /** Save button disabled state */
  isSaveDisabled?: boolean;
  /** Callback when Save button is clicked */
  onSave?: () => void;
}

/**
 * FormTextArea wraps shadcn's InputGroupTextarea with optional character counter and Save button.
 * Character count and Save button appear at the block-end addon (bottom right).
 *
 * Usage:
 * <FormTextArea
 *   value={value}
 *   onChange={e => setValue(e.target.value)}
 *   maxLength={280}
 *   currentLength={value.length}
 *   showSaveButton
 *   isSaving={isSaving}
 *   isSaveDisabled={!isDirty}
 *   onSave={handleSave}
 *   rows={3}
 * />
 */
export function FormTextArea({
  maxLength,
  showCharCount = true,
  currentLength = 0,
  showSaveButton = false,
  isSaving = false,
  isSaveDisabled = false,
  onSave,
  ...textareaProps
}: FormTextAreaProps) {
  const charCountEnabled = showCharCount && typeof maxLength === "number";

  return (
    <InputGroup className="md:max-w-[72ch] lg:max-w-[72ch] xl:max-w-[72ch]">
      <InputGroupTextarea {...textareaProps} maxLength={maxLength} />
      {(charCountEnabled || showSaveButton) && (
        <InputGroupAddon align="block-end" className="items-end">
          {charCountEnabled && (
            <InputGroupText className="text-xs font-medium">
              {currentLength}/{maxLength}
            </InputGroupText>
          )}
          {showSaveButton && (
            <InputGroupButton
              onClick={() => {
                if (isSaveDisabled || isSaving) return;
                onSave?.();
              }}
              disabled={isSaveDisabled || isSaving}
              className="ml-auto"
              size="sm"
              variant="default"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Saving</span>
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
