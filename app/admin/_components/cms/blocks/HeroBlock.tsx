"use client";

import { HeroBlock as HeroBlockType } from "@/lib/blocks/schemas";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Hero } from "@/app/(site)/_components/content/Hero";
import { BlockDialog } from "./BlockDialog";
import { ImageField } from "@/app/admin/_components/cms/fields/ImageField";
import { useImageUpload } from "@/app/admin/_hooks/useImageUpload";
import { useValidation } from "@/hooks/useFormDialog";

interface HeroBlockProps {
  block: HeroBlockType;
  isEditing: boolean;
  onUpdate?: (block: HeroBlockType) => void;
  /** Page slug for organizing uploaded images */
  pageSlug?: string;
  // Dialog control from BlockRenderer
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function HeroBlock({
  block,
  isEditing,
  onUpdate,
  pageSlug,
  isDialogOpen = false,
  onDialogOpenChange,
}: HeroBlockProps) {
  // For backward compatibility, use internal state if not controlled
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = onDialogOpenChange ? isDialogOpen : internalDialogOpen;
  const setDialogOpen = onDialogOpenChange || setInternalDialogOpen;

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
  } = useImageUpload({ currentUrl: block.content.imageUrl, pageSlug });

  // Sync editedBlock with block prop when it changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Display mode (non-editing page view)
  // BlockRenderer handles deleted state and wrapper
  if (!isEditing) {
    return (
      <Hero
        heading={block.content.heading}
        imageUrl={block.content.imageUrl}
        imageAlt={block.content.imageAlt}
        caption={block.content.caption}
      />
    );
  }

  // Save changes from dialog
  const handleSave = async () => {
    // Validate required fields
    const fieldErrors: { imageUrl?: string } = {};

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
    setDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedBlock(block);
    resetImage();
    clearAllErrors();
    setDialogOpen(false);
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
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
              htmlFor={`hero-heading-${block.id}`}
              label="Heading"
              isDirty={editedBlock.content.heading !== block.content.heading}
            />
            <Input
              id={`hero-heading-${block.id}`}
              value={editedBlock.content.heading || ""}
              onChange={(e) => {
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    heading: e.target.value,
                  },
                });
              }}
              placeholder="e.g., About Our Roastery (optional)"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(editedBlock.content.heading || "").length}/100 characters
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

      {/* Display content - wrapper handled by BlockRenderer */}
      <Hero
        heading={block.content.heading}
        imageUrl={block.content.imageUrl}
        imageAlt={block.content.imageAlt}
        caption={block.content.caption}
      />
    </>
  );
}
