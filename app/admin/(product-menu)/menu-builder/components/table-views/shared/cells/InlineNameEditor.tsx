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
  const isDefaultNewName = /^new (category|label)(?:\s*\(\d+\)|\s+\d+)?$/i.test(trimmedValue);
  const isCloneCopyName = /\bcopy(?:\s*\(\d+\)|\s+\d+)?$/i.test(trimmedValue);
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
    return (
      <button
        onClick={onStartEdit}
        className="group inline-flex max-w-full min-w-0 items-center gap-2 text-sm text-left hover:bg-accent rounded-md px-2 py-1"
      >
        <span
          className={
            isGenericName
              ? "min-w-0 truncate italic text-muted-foreground"
              : `min-w-0 truncate ${isHidden ? "text-muted-foreground" : "text-foreground"}`
          }
        >
          {value}
        </span>
        <Pencil className="w-3 h-3 shrink-0 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div ref={containerRef} onBlur={handleContainerBlur} className="flex items-center gap-1">
      <p
        ref={editableRef}
        contentEditable={!isLoading}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        tabIndex={0}
        className="outline-none rounded-md px-2 py-1 text-sm focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring min-w-0"
      >
        {value}
      </p>
      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={isLoading}
        className="h-6 w-6 p-0 shrink-0"
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
        className="h-6 w-6 p-0 shrink-0"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
