import { Button } from "@/components/ui/button";
import { Check, Pencil, X } from "lucide-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

type InlineNameEditorProps = {
  id: string;
  initialValue: string;
  isEditing: boolean;
  /** When true, applies muted text styling (for hidden/not visible rows) */
  isHidden?: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (id: string, name: string) => Promise<void>;
};

export function InlineNameEditor({
  id,
  initialValue,
  isEditing,
  isHidden,
  onStartEdit,
  onCancelEdit,
  onSave,
}: InlineNameEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const editableRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedValue = value.trim();
  // Match "New Label", "New Label2", "New Category3", etc.
  const isDefaultNewName = /^new (category|label)\d*$/i.test(trimmedValue);
  // Match "Name copy", "Name copy2", "Name copy3", etc.
  const isCloneCopyName = /\scopy\d*$/i.test(trimmedValue);
  const isGenericName = isDefaultNewName || isCloneCopyName;

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const handleSave = async () => {
    const currentText = editableRef.current?.textContent?.trim() || "";

    if (currentText === "") {
      setValue(initialValue);
      onCancelEdit();
      return;
    }

    if (currentText === initialValue) {
      onCancelEdit();
      return;
    }

    setIsLoading(true);
    try {
      await onSave(id, currentText);
      setValue(currentText);
    } catch (error) {
      console.error("Failed to save:", error);
      setValue(initialValue);
      onCancelEdit();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    onCancelEdit();
  };

  const handleContainerBlur = (e: React.FocusEvent) => {
    const nextFocused = e.relatedTarget as Node | null;
    if (nextFocused && containerRef.current?.contains(nextFocused)) {
      return;
    }
    handleCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isEditing) {
    // Use a non-button wrapper so row clicks can propagate for selection
    // Only the pencil icon is interactive to start edit mode
    return (
      <span className="group inline-flex items-center gap-2 text-sm text-left">
        <span
          className={
            isGenericName
              ? "italic text-muted-foreground"
              : isHidden ? "text-muted-foreground" : "text-foreground"
          }
        >
          {value}
        </span>
        <button
          onClick={onStartEdit}
          className="relative shrink-0 p-1 rounded-sm hover:bg-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 transition-opacity outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] before:absolute before:-inset-3 before:md:hidden"
          aria-label={`Edit ${value}`}
        >
          <Pencil className="w-3 h-3 text-muted-foreground" />
        </button>
      </span>
    );
  }

  return (
    <div ref={containerRef} onBlur={handleContainerBlur} className="inline-flex items-center gap-1 pr-1">
      <p
        ref={editableRef}
        contentEditable={!isLoading}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        tabIndex={0}
        className="outline-none rounded-md pl-1 pr-2 py-1 text-sm focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-inset"
      >
        {value}
      </p>
      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={isLoading}
        className="relative h-6 w-6 p-0 shrink-0 before:absolute before:-inset-2 before:md:hidden"
        variant="ghost"
      >
        <Check className="w-3 h-3" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        disabled={isLoading}
        className="relative h-6 w-6 p-0 shrink-0 before:absolute before:-inset-2 before:md:hidden"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
