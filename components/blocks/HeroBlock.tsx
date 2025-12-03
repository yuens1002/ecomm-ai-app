"use client";

import { HeroBlock as HeroBlockType } from "@/lib/blocks/schemas";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { Hero } from "@/components/app-components/Hero";
import { EditableBlockWrapper } from "./EditableBlockWrapper";
import { BlockDialog } from "./BlockDialog";
import { ImageField } from "@/components/app-components/ImageField";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useValidation } from "@/hooks/useFormDialog";

interface HeroBlockProps {
  block: HeroBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  canDelete?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: HeroBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function HeroBlock({
  block,
  isEditing,
  isSelected = false,
  canDelete = true,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: HeroBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);

  // Use validation hook for error state and toast
  const { errors, hasErrors, clearError, clearAllErrors, showValidationError } =
    useValidation<{ title?: string; imageUrl?: string }>();

  // Use shared image upload hook
  const {
    pendingFile,
    previewUrl,
    isDirty: isImageDirty,
    handleFileSelect: handleImageSelect,
    uploadFile,
    reset: resetImage,
  } = useImageUpload({ currentUrl: block.content.imageUrl });

  // Sync editedBlock with block prop when it changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="Hero Block"
        onRestore={onRestore}
      >
        <Hero
          title={block.content.title || "Untitled"}
          imageUrl={block.content.imageUrl}
          imageAlt={block.content.imageAlt}
          caption={block.content.caption}
        />
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
  if (!isEditing) {
    return (
      <Hero
        title={block.content.title}
        imageUrl={block.content.imageUrl}
        imageAlt={block.content.imageAlt}
        caption={block.content.caption}
      />
    );
  }

  // Save changes from dialog
  const handleSave = async () => {
    // Validate required fields
    const fieldErrors: { title?: string; imageUrl?: string } = {};

    if (!editedBlock.content.title.trim()) {
      fieldErrors.title = "Title is required";
    }

    if (!editedBlock.content.imageUrl.trim() && !pendingFile) {
      fieldErrors.imageUrl = "Image is required";
    }

    // Show toast and set errors if validation fails
    if (!showValidationError(fieldErrors)) {
      return;
    }

    let finalBlock = editedBlock;

    // Upload pending file if exists (hook handles old image cleanup)
    if (pendingFile) {
      try {
        const newPath = await uploadFile();
        if (newPath) {
          finalBlock = {
            ...editedBlock,
            content: {
              ...editedBlock.content,
              imageUrl: newPath,
            },
          };
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload image. Please try again.");
        return;
      }
    }

    onUpdate?.(finalBlock);
    setIsDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedBlock(block);
    resetImage();
    clearAllErrors();
    setIsDialogOpen(false);
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Edit Hero"
        description="Update the hero banner image, title, and caption"
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
              htmlFor={`hero-title-${block.id}`}
              label="Title"
              required={true}
              validationType={errors.title ? "error" : undefined}
              isDirty={editedBlock.content.title !== block.content.title}
              errorMessage={errors.title}
            />
            <Input
              id={`hero-title-${block.id}`}
              value={editedBlock.content.title}
              onChange={(e) => {
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    title: e.target.value,
                  },
                });
                if (errors.title) clearError("title");
              }}
              placeholder="e.g., About Our Roastery"
              maxLength={100}
              className={errors.title ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editedBlock.content.title.length}/100 characters
            </p>
          </Field>
          <ImageField
            id={`hero-image-${block.id}`}
            label="Image"
            required={true}
            value={editedBlock.content.imageUrl}
            pendingFile={pendingFile}
            previewUrl={previewUrl}
            onFileSelect={(file, imageFieldPreview) => {
              try {
                handleImageSelect(file, imageFieldPreview);
                if (errors.imageUrl) clearError("imageUrl");
              } catch (err) {
                alert(err instanceof Error ? err.message : "Invalid file");
              }
            }}
            error={errors.imageUrl}
            isDirty={
              editedBlock.content.imageUrl !== block.content.imageUrl ||
              isImageDirty
            }
            showAltText
            altText={editedBlock.content.imageAlt || ""}
            onAltTextChange={(alt) =>
              setEditedBlock({
                ...editedBlock,
                content: { ...editedBlock.content, imageAlt: alt },
              })
            }
            altTextMaxLength={200}
          />
          <Field>
            <FormHeading htmlFor={`hero-caption-${block.id}`} label="Caption" />
            <Input
              id={`hero-caption-${block.id}`}
              value={editedBlock.content.caption || ""}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    caption: e.target.value,
                  },
                })
              }
              placeholder="Image caption or description..."
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(editedBlock.content.caption || "").length}/500 characters
            </p>
          </Field>
        </FieldGroup>
      </BlockDialog>

      {/* WYSIWYG Block Display with hover/select states */}
      <EditableBlockWrapper
        onEdit={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
        editButtons={
          canDelete && (
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
          )
        }
      >
        <Hero
          title={block.content.title || "Untitled"}
          imageUrl={block.content.imageUrl}
          imageAlt={block.content.imageAlt}
          caption={block.content.caption}
        />
      </EditableBlockWrapper>
    </>
  );
}
