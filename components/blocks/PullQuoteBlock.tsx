"use client";

import {
  PullQuoteBlock as PullQuoteBlockType,
  BLOCK_METADATA,
} from "@/lib/blocks/schemas";
import { PullQuote } from "@/components/app-components/PullQuote";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { BlockDialog } from "./BlockDialog";
import { useValidation } from "@/hooks/useFormDialog";

interface PullQuoteBlockProps {
  block: PullQuoteBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  canDelete?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: PullQuoteBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function PullQuoteBlock({
  block,
  isEditing,
  isSelected = false,
  canDelete = true,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: PullQuoteBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  // Use validation hook for error state and toast
  const { errors, hasErrors, clearError, clearAllErrors, showValidationError } =
    useValidation<{ text?: string }>();

  // Sync editedBlock with block prop when it changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="Pull Quote Block"
        onRestore={onRestore}
      >
        <PullQuote text={block.content.text} author={block.content.author} />
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
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
    setIsDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedBlock(block);
    clearAllErrors();
    setIsDialogOpen(false);
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
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

      {/* WYSIWYG Block Display with hover/select states */}
      <PullQuote
        text={block.content.text}
        author={block.content.author}
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
