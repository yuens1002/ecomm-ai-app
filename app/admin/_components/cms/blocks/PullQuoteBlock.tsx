"use client";

import {
  PullQuoteBlock as PullQuoteBlockType,
  BLOCK_METADATA,
} from "@/lib/blocks/schemas";
import { PullQuote } from "@/app/(site)/_components/content/PullQuote";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { BlockDialog } from "./BlockDialog";
import { useValidation } from "@/hooks/useFormDialog";

interface PullQuoteBlockProps {
  block: PullQuoteBlockType;
  isEditing: boolean;
  onUpdate?: (block: PullQuoteBlockType) => void;
  // Dialog control from BlockRenderer
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function PullQuoteBlock({
  block,
  isEditing,
  onUpdate,
  isDialogOpen = false,
  onDialogOpenChange,
}: PullQuoteBlockProps) {
  // For backward compatibility, use internal state if not controlled
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = onDialogOpenChange ? isDialogOpen : internalDialogOpen;
  const setDialogOpen = onDialogOpenChange || setInternalDialogOpen;

  const [editedBlock, setEditedBlock] = useState(block);

  // Use validation hook for error state and toast
  const { errors, hasErrors, clearError, clearAllErrors, showValidationError } =
    useValidation<{ text?: string }>();

  // Sync editedBlock with block prop when it changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Display mode (non-editing page view)
  // BlockRenderer handles deleted state and wrapper
  if (!isEditing) {
    return (
      <PullQuote text={block.content.text} author={block.content.author} />
    );
  }

  // Save changes from dialog
  const handleSave = () => {
    // Validate required fields
    const fieldErrors: { text?: string } = {};

    if (!editedBlock.content.text.trim()) {
      fieldErrors.text = "Quote text is required";
    }

    // Show toast and set errors if validation fails
    if (!showValidationError(fieldErrors)) {
      return;
    }

    onUpdate?.(editedBlock);
    setDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedBlock(block);
    clearAllErrors();
    setDialogOpen(false);
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={`Edit ${BLOCK_METADATA.pullQuote.name}`}
        description={BLOCK_METADATA.pullQuote.description}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={hasErrors}>
              Save
            </Button>
          </>
        }
      >
        <FieldGroup>
          <Field>
            <FormHeading
              htmlFor={`quote-text-${block.id}`}
              label="Quote Text"
              required={true}
              validationType={errors.text ? "error" : undefined}
              isDirty={editedBlock.content.text !== block.content.text}
              errorMessage={errors.text}
            />
            <Textarea
              id={`quote-text-${block.id}`}
              value={editedBlock.content.text}
              onChange={(e) => {
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, text: e.target.value },
                });
                if (errors.text) clearError("text");
              }}
              placeholder="Enter quote text..."
              rows={4}
              maxLength={500}
              className={errors.text ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editedBlock.content.text.length}/500 characters
            </p>
          </Field>
          <Field>
            <FormHeading
              htmlFor={`quote-author-${block.id}`}
              label="Author"
              isDirty={
                (editedBlock.content.author || "") !==
                (block.content.author || "")
              }
            />
            <Input
              id={`quote-author-${block.id}`}
              value={editedBlock.content.author || ""}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    author: e.target.value,
                  },
                })
              }
              placeholder="e.g., Founder"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(editedBlock.content.author || "").length}/100 characters
            </p>
          </Field>
        </FieldGroup>
      </BlockDialog>

      {/* Display content - wrapper handled by BlockRenderer */}
      <PullQuote text={block.content.text} author={block.content.author} />
    </>
  );
}
