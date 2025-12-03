"use client";

import { ImageGalleryBlock as ImageGalleryBlockType } from "@/lib/blocks/schemas";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { EditableBlockWrapper } from "./EditableBlockWrapper";
import { BlockDialog } from "./BlockDialog";

interface GalleryGridProps {
  images: Array<{ url: string; alt?: string }>;
  className?: string;
}

/**
 * Reusable image grid component
 * Displays multiple images in a responsive grid layout
 */
export function GalleryGrid({ images, className = "" }: GalleryGridProps) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-4/3 overflow-hidden rounded-lg"
        >
          <Image
            src={image.url}
            alt={image.alt || `Gallery image ${index + 1}`}
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

interface ImageGalleryBlockProps {
  block: ImageGalleryBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: ImageGalleryBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function ImageGalleryBlock({
  block,
  isEditing,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: ImageGalleryBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);
  const [pendingFiles, setPendingFiles] = useState<
    Map<number, { file: File; previewUrl: string }>
  >(new Map());

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="Image Gallery Block"
        onRestore={onRestore}
      >
        <GalleryGrid images={block.content.images} />
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
  if (!isEditing) {
    return <GalleryGrid images={block.content.images} />;
  }

  // Handle file selection for an image
  const handleFileSelect = (index: number, file: File) => {
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }

    // Clean up old preview URL if exists
    const oldPending = pendingFiles.get(index);
    if (oldPending) {
      URL.revokeObjectURL(oldPending.previewUrl);
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPendingFiles(new Map(pendingFiles.set(index, { file, previewUrl })));
  };

  // Save changes from dialog
  const handleSave = async () => {
    // Upload any pending files
    const updatedImages = await Promise.all(
      editedBlock.content.images.map(async (image, index) => {
        const pending = pendingFiles.get(index);
        if (pending) {
          try {
            const formData = new FormData();
            formData.append("file", pending.file);
            if (image.url) {
              formData.append("oldPath", image.url);
            }

            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error("Upload failed");
            }

            const data = await response.json();
            return { ...image, url: data.path };
          } catch (error) {
            console.error("Upload error:", error);
            return image;
          }
        }
        return image;
      })
    );

    // Clean up preview URLs
    pendingFiles.forEach((pending) => URL.revokeObjectURL(pending.previewUrl));
    setPendingFiles(new Map());

    onUpdate?.({
      ...editedBlock,
      content: { images: updatedImages },
    });
    setIsDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
    // Clean up preview URLs
    pendingFiles.forEach((pending) => URL.revokeObjectURL(pending.previewUrl));
    setPendingFiles(new Map());
    setEditedBlock(block);
    setIsDialogOpen(false);
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Edit Image Gallery Block"
        description={`Manage gallery images • ${editedBlock.content.images.length} of 20 images`}
        size="lg"
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
          {editedBlock.content.images.map((image, index) => {
            const pending = pendingFiles.get(index);
            const displayUrl = pending?.previewUrl || image.url;

            return (
              <div key={index} className="border rounded-lg p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">
                    Image {index + 1}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      // Clean up pending if exists
                      const oldPending = pendingFiles.get(index);
                      if (oldPending) {
                        URL.revokeObjectURL(oldPending.previewUrl);
                        const newPending = new Map(pendingFiles);
                        newPending.delete(index);
                        setPendingFiles(newPending);
                      }

                      const newImages = editedBlock.content.images.filter(
                        (_, i) => i !== index
                      );
                      setEditedBlock({
                        ...editedBlock,
                        content: { images: newImages },
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Image Preview & Upload */}
                <div className="relative h-32 w-full rounded-lg overflow-hidden border">
                  {displayUrl ? (
                    <>
                      {pending ? (
                        <img
                          src={pending.previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={image.url}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      )}
                      <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/0 hover:bg-black/40 transition-colors group">
                        <Upload className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(index, file);
                          }}
                        />
                      </label>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <Upload className="h-8 w-8 text-muted-foreground/40 mb-1" />
                      <span className="text-sm text-muted-foreground">
                        Upload Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(index, file);
                        }}
                      />
                    </label>
                  )}
                </div>

                <Field>
                  <FormHeading
                    htmlFor={`gallery-alt-${block.id}-${index}`}
                    label="Alt Text"
                    isDirty={
                      (image.alt || "") !==
                      (block.content.images[index]?.alt || "")
                    }
                  />
                  <Input
                    id={`gallery-alt-${block.id}-${index}`}
                    value={image.alt || ""}
                    onChange={(e) => {
                      const newImages = [...editedBlock.content.images];
                      newImages[index] = { ...image, alt: e.target.value };
                      setEditedBlock({
                        ...editedBlock,
                        content: { images: newImages },
                      });
                    }}
                    placeholder="Describe the image..."
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(image.alt || "").length}/200 characters
                  </p>
                </Field>
              </div>
            );
          })}

          {editedBlock.content.images.length < 20 && (
            <Button
              variant="outline"
              onClick={() => {
                const newImages = [
                  ...editedBlock.content.images,
                  { url: "", alt: "" },
                ];
                setEditedBlock({
                  ...editedBlock,
                  content: { images: newImages },
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          )}
        </FieldGroup>
      </BlockDialog>

      {/* WYSIWYG Block Display with hover/select states */}
      <EditableBlockWrapper
        onEdit={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
        editButtons={
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
        }
      >
        <GalleryGrid images={block.content.images} />
      </EditableBlockWrapper>
    </>
  );
}
