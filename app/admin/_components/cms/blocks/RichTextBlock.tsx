"use client";

import {
  RichTextBlock as RichTextBlockType,
  BLOCK_METADATA,
  richTextBlockSchema,
} from "@/lib/blocks/schemas";
import { Typography } from "@/components/ui/typography";
import { RichTextEditor } from "@/app/admin/_components/cms/editors/RichTextEditor";
import { Field } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BlockDialog } from "./BlockDialog";

interface RichTextBlockProps {
  block: RichTextBlockType;
  isEditing: boolean;
  isNew?: boolean;
  onUpdate?: (block: RichTextBlockType) => void;
  onDelete?: (blockId: string) => void;
  // Dialog control from BlockRenderer
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function RichTextBlock({
  block,
  isEditing,
  isNew = false,
  onUpdate,
  onDelete,
  isDialogOpen = false,
  onDialogOpenChange,
}: RichTextBlockProps) {
  // For backward compatibility, use internal state if not controlled
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = onDialogOpenChange ? isDialogOpen : internalDialogOpen;
  const setDialogOpen = onDialogOpenChange || setInternalDialogOpen;

  const [editedBlock, setEditedBlock] = useState<RichTextBlockType>(block);
  const [errors, setErrors] = useState<{ html?: string }>({});

  // Display mode (non-editing page view)
  // BlockRenderer handles deleted state and wrapper
  if (!isEditing) {
    return (
      <Typography>
        <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
      </Typography>
    );
  }

  // Save changes from dialog
  const handleSave = () => {
    // Validate before saving
    const result = richTextBlockSchema.safeParse(editedBlock);
    if (!result.success) {
      const fieldErrors: { html?: string } = {};
      const zodErrors = result.error.issues || [];

      for (const err of zodErrors) {
        const field = err.path[err.path.length - 1] as string;
        if (field === "html") {
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
            ? `Add ${BLOCK_METADATA.richText.name}`
            : `Edit ${BLOCK_METADATA.richText.name}`
        }
        description={BLOCK_METADATA.richText.description}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{isNew ? "Add" : "Save"}</Button>
          </>
        }
      >
        <Field>
          <FormHeading
            htmlFor="rich-text-content"
            label="Content"
            required={true}
            validationType={errors.html ? "error" : undefined}
            isDirty={
              errors.html
                ? true
                : editedBlock.content.html !== block.content.html &&
                  editedBlock.content.html !== ""
            }
            errorMessage={errors.html}
          />
          <RichTextEditor
            content={editedBlock.content.html}
            onChange={(html) => {
              setEditedBlock({
                ...editedBlock,
                content: { ...editedBlock.content, html },
              });
              if (errors.html) setErrors({ html: undefined });
            }}
            placeholder="Start typing your content..."
            className={errors.html ? "border-destructive" : ""}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use the toolbar to format your content. Supports headings, bold,
            italic, lists, and links.
          </p>
        </Field>
      </BlockDialog>

      {/* Display content - wrapper handled by BlockRenderer */}
      <Typography>
        <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
      </Typography>
    </>
  );
}
