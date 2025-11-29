"use client";

import {
  RichTextBlock as RichTextBlockType,
  BLOCK_METADATA,
  richTextBlockSchema,
} from "@/lib/blocks/schemas";
import { Typography } from "@/components/ui/typography";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Field } from "@/components/ui/field";
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

interface RichTextBlockProps {
  block: RichTextBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  canDelete?: boolean;
  isNew?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: RichTextBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function RichTextBlock({
  block,
  isEditing,
  isSelected = false,
  canDelete = true,
  isNew = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: RichTextBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState<RichTextBlockType>(block);
  const [errors, setErrors] = useState<{ html?: string }>({});
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // Auto-open dialog when block is selected (for newly added blocks)
  useEffect(() => {
    if (isSelected && isEditing && !hasOpenedOnce) {
      // For new blocks, clear the default values to show placeholder
      if (isNew) {
        setEditedBlock({
          ...block,
          content: { html: "" },
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
        blockName="Rich Text Block"
        onRestore={onRestore}
      >
        <Typography>
          <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
        </Typography>
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pr-8 flex-shrink-0">
            <DialogTitle>
              {isNew
                ? `Add ${BLOCK_METADATA.richText.name}`
                : `Edit ${BLOCK_METADATA.richText.name}`}
            </DialogTitle>
            <DialogDescription>
              {BLOCK_METADATA.richText.description}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
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
      <Typography
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
      >
        <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
      </Typography>
    </>
  );
}
