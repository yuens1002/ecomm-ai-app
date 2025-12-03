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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; imageUrl?: string }>(
    {}
  );

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

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    let finalBlock = editedBlock;

    // Upload pending file if exists
    if (pendingFile) {
      try {
        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("oldPath", block.content.imageUrl);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();

        // Update with the actual uploaded path
        finalBlock = {
          ...editedBlock,
          content: {
            ...editedBlock.content,
            imageUrl: data.path,
          },
        };
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload image. Please try again.");
        return;
      }
    }

    onUpdate?.(finalBlock);
    setPendingFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setIsDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedBlock(block);
    setPendingFile(null);
    setErrors({});
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
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
            <Button onClick={handleSave}>Save</Button>
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
                if (errors.title) setErrors({ ...errors, title: undefined });
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
            onFileSelect={(file, preview) => {
              setPendingFile(file);
              setPreviewUrl(preview);
              if (errors.imageUrl)
                setErrors({ ...errors, imageUrl: undefined });
            }}
            onClear={() => {
              setPendingFile(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
              setEditedBlock({
                ...editedBlock,
                content: { ...editedBlock.content, imageUrl: "" },
              });
            }}
            error={errors.imageUrl}
            isDirty={
              editedBlock.content.imageUrl !== block.content.imageUrl ||
              pendingFile !== null
            }
            previewAlt={editedBlock.content.imageAlt || "Hero preview"}
          />
          <Field>
            <FormHeading
              htmlFor={`hero-alt-${block.id}`}
              label="Image Alt Text"
            />
            <Input
              id={`hero-alt-${block.id}`}
              value={editedBlock.content.imageAlt || ""}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    imageAlt: e.target.value,
                  },
                })
              }
              placeholder="Describe the image..."
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(editedBlock.content.imageAlt || "").length}/200 characters
            </p>
          </Field>
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
