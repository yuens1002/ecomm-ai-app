"use client";

import {
  StatBlock as StatBlockType,
  BLOCK_METADATA,
  statBlockSchema,
} from "@/lib/blocks/schemas";
import { StatCard } from "@/components/app-components/StatCard";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldError } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StatBlockProps {
  block: StatBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  canDelete?: boolean;
  isNew?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: StatBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function StatBlock({
  block,
  isEditing,
  isSelected = false,
  canDelete = true,
  isNew = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: StatBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState<StatBlockType>(block);
  const [errors, setErrors] = useState<{ value?: string; label?: string }>({});
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // Auto-open dialog when block is selected (for newly added blocks)
  useEffect(() => {
    if (isSelected && isEditing && !hasOpenedOnce) {
      // For new blocks, clear the default values to show empty fields
      if (isNew) {
        setEditedBlock({
          ...block,
          content: { value: "", label: "" },
        });
      }
      setIsDialogOpen(true);
      setHasOpenedOnce(true);
    }
  }, [isSelected, isEditing, isNew, block, hasOpenedOnce]);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="Stat Block"
        onRestore={onRestore}
      >
        <StatCard label={block.content.label} value={block.content.value} />
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
  if (!isEditing) {
    return <StatCard label={block.content.label} value={block.content.value} />;
  }

  // Save changes from dialog
  const handleSave = () => {
    // Validate before saving
    const result = statBlockSchema.safeParse(editedBlock);
    if (!result.success) {
      const fieldErrors: { value?: string; label?: string } = {};
      const zodErrors = result.error.issues || [];

      for (const err of zodErrors) {
        const field = err.path[err.path.length - 1] as string;
        if (field === "value" || field === "label") {
          fieldErrors[field] = err.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onUpdate?.(editedBlock);
    setIsDialogOpen(false);
  };

  // Cancel changes - if new block, delete it; otherwise just revert
  const handleCancel = () => {
    if (isNew) {
      onDelete?.(block.id);
    } else {
      setEditedBlock(block);
      setIsDialogOpen(false);
    }
  };

  // Handle dialog close (X button or ESC) - same as cancel
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    } else {
      setIsDialogOpen(open);
    }
  };

  // Edit mode with dialog
  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pr-8 flex-shrink-0">
            <DialogTitle>
              {isNew
                ? `Add ${BLOCK_METADATA.stat.name}`
                : `Edit ${BLOCK_METADATA.stat.name}`}
            </DialogTitle>
            <DialogDescription>
              {BLOCK_METADATA.stat.description}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <FieldGroup>
              <Field>
                <FormHeading
                  htmlFor={`stat-value-${block.id}`}
                  label="Value"
                  required={true}
                  validationType={errors.value ? "error" : undefined}
                  isDirty={
                    errors.value
                      ? true
                      : editedBlock.content.value !== block.content.value &&
                        editedBlock.content.value !== ""
                  }
                  errorMessage={errors.value}
                />
                <Input
                  id={`stat-value-${block.id}`}
                  value={editedBlock.content.value}
                  onChange={(e) => {
                    setEditedBlock({
                      ...editedBlock,
                      content: {
                        ...editedBlock.content,
                        value: e.target.value,
                      },
                    });
                    if (errors.value)
                      setErrors({ ...errors, value: undefined });
                  }}
                  placeholder="e.g., 25+"
                  maxLength={50}
                  className={errors.value ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editedBlock.content.value.length}/50 characters
                </p>
              </Field>
              <Field>
                <FormHeading
                  htmlFor={`stat-label-${block.id}`}
                  label="Label"
                  required={true}
                  validationType={errors.label ? "error" : undefined}
                  isDirty={
                    errors.label
                      ? true
                      : editedBlock.content.label !== block.content.label &&
                        editedBlock.content.label !== ""
                  }
                  errorMessage={errors.label}
                />
                <Input
                  id={`stat-label-${block.id}`}
                  value={editedBlock.content.label}
                  onChange={(e) => {
                    setEditedBlock({
                      ...editedBlock,
                      content: {
                        ...editedBlock.content,
                        label: e.target.value,
                      },
                    });
                    if (errors.label)
                      setErrors({ ...errors, label: undefined });
                  }}
                  placeholder="e.g., Years of Experience"
                  maxLength={50}
                  className={errors.label ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editedBlock.content.label.length}/50 characters
                </p>
              </Field>
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-2 mt-6 flex-shrink-0">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{isNew ? "Add" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WYSIWYG Block Display with hover/select states */}
      <StatCard
        label={block.content.label}
        value={block.content.value}
        isEditing={true}
        onClick={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
        actionButtons={
          canDelete ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(block.id);
              }}
              className="shadow-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : undefined
        }
      />
    </>
  );
}
