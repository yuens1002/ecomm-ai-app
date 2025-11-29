"use client";

import { HeroBlock as HeroBlockType } from "@/lib/blocks/schemas";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { Hero } from "@/components/app-components/Hero";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pr-8 flex-shrink-0">
            <DialogTitle>Edit Hero</DialogTitle>
            <DialogDescription>
              Update the hero banner image, title, and caption
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
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
                    if (errors.title)
                      setErrors({ ...errors, title: undefined });
                  }}
                  placeholder="e.g., About Our Roastery"
                  maxLength={100}
                  className={errors.title ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {editedBlock.content.title.length}/100 characters
                </p>
              </Field>
              <Field>
                <FormHeading
                  htmlFor={`hero-image-${block.id}`}
                  label="Image URL"
                  required={true}
                  validationType={errors.imageUrl ? "error" : undefined}
                  isDirty={
                    editedBlock.content.imageUrl !== block.content.imageUrl ||
                    pendingFile !== null
                  }
                  errorMessage={errors.imageUrl}
                />
                <div className="flex gap-2">
                  <Input
                    id={`hero-image-${block.id}`}
                    value={
                      pendingFile
                        ? `/images/${pendingFile.name}`
                        : editedBlock.content.imageUrl
                    }
                    readOnly
                    placeholder="Click upload button to select an image"
                    className={`cursor-default ${errors.imageUrl ? "border-destructive" : ""}`}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      document.getElementById(`hero-file-${block.id}`)?.click()
                    }
                    type="button"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input
                    id={`hero-file-${block.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Store the file for later upload
                      setPendingFile(file);

                      // Create preview URL
                      const objectUrl = URL.createObjectURL(file);
                      setPreviewUrl(objectUrl);

                      // Don't set imageUrl yet - it will be set after successful upload
                      // Just clear any image error
                      if (errors.imageUrl)
                        setErrors({ ...errors, imageUrl: undefined });
                    }}
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor={`hero-alt-${block.id}`}>
                  Image Alt Text
                </FieldLabel>
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
                <FieldLabel htmlFor={`hero-caption-${block.id}`}>
                  Caption
                </FieldLabel>
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

            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">Image Preview</h3>
              {previewUrl || editedBlock.content.imageUrl ? (
                <div className="relative h-48 w-full rounded-lg overflow-hidden border">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={editedBlock.content.imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="relative h-48 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/10">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No image selected
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 flex-shrink-0">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WYSIWYG Block Display with hover/select states */}
      <div
        className="relative group cursor-pointer transition-all hover:ring-1 hover:ring-[#00d4ff]"
        onClick={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
      >
        <Hero
          title={block.content.title || "Untitled"}
          imageUrl={block.content.imageUrl}
          imageAlt={block.content.imageAlt}
          caption={block.content.caption}
        />

        {/* Action Controls on Hover */}
        {canDelete && (
          <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
          </div>
        )}
      </div>
    </>
  );
}
