"use client";

import {
  StatBlock as StatBlockType,
  BLOCK_METADATA,
  statBlockSchema,
} from "@/lib/blocks/schemas";
import { StatCard } from "@/components/app-components/StatCard";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BlockDialog } from "./BlockDialog";

interface StatBlockProps {
  block: StatBlockType;
  isEditing: boolean;
  isNew?: boolean;
  onUpdate?: (block: StatBlockType) => void;
  onDelete?: (blockId: string) => void;
  // Dialog control from BlockRenderer
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function StatBlock({
  block,
  isEditing,
  isNew = false,
  onUpdate,
  onDelete,
  isDialogOpen = false,
  onDialogOpenChange,
}: StatBlockProps) {
  // For backward compatibility, use internal state if not controlled
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = onDialogOpenChange ? isDialogOpen : internalDialogOpen;
  const setDialogOpen = onDialogOpenChange || setInternalDialogOpen;

  const [editedBlock, setEditedBlock] = useState<StatBlockType>(block);
  const [errors, setErrors] = useState<{ value?: string; label?: string }>({});

  // Display mode (non-editing page view)
  // BlockRenderer handles deleted state and wrapper
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
    setDialogOpen(false);
  };

  // Cancel changes - if new block, delete it; otherwise just revert
  const handleCancel = () => {
    if (isNew) {
      onDelete?.(block.id);
    } else {
      setEditedBlock(block);
      setDialogOpen(false);
    }
  };

  // Handle dialog close (X button or ESC) - same as cancel
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    } else {
      setDialogOpen(open);
    }
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        title={
          isNew
            ? `Add ${BLOCK_METADATA.stat.name}`
            : `Edit ${BLOCK_METADATA.stat.name}`
        }
        description={BLOCK_METADATA.stat.description}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{isNew ? "Add" : "Save"}</Button>
          </>
        }
      >
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
                if (errors.value) setErrors({ ...errors, value: undefined });
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
                if (errors.label) setErrors({ ...errors, label: undefined });
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
      </BlockDialog>

      {/* Display content - wrapper handled by BlockRenderer */}
      <StatCard label={block.content.label} value={block.content.value} />
    </>
  );
}
