"use client";

import { ImageGalleryBlock as ImageGalleryBlockType } from "@/lib/blocks/schemas";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { BlockDialog } from "./BlockDialog";
import { useMultiImageUpload } from "@/hooks/useImageUpload";
import { ImageCard } from "@/components/app-components/ImageCard";

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
  onUpdate?: (block: ImageGalleryBlockType) => void;
  /** Page slug for organizing uploaded images */
  pageSlug?: string;
  // Dialog control from BlockRenderer
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function ImageGalleryBlock({
  block,
  isEditing,
  onUpdate,
  pageSlug,
  isDialogOpen = false,
  onDialogOpenChange,
}: ImageGalleryBlockProps) {
  // For backward compatibility, use internal state if not controlled
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = onDialogOpenChange ? isDialogOpen : internalDialogOpen;
  const setDialogOpen = onDialogOpenChange || setInternalDialogOpen;

  const [editedBlock, setEditedBlock] = useState(block);

  // Use shared multi-image upload hook
  const {
    images,
    addImage,
    addImageAfter,
    removeImage,
    moveUp,
    moveDown,
    handleFileSelect: handleImageSelect,
    updateAlt,
    uploadAll,
    reset: resetImages,
    canAdd,
    canRemove,
    highlightedIndex,
    setCardRef,
  } = useMultiImageUpload({
    currentImages: block.content.images,
    minImages: 0,
    maxImages: 20,
    pageSlug,
  });

  // Sync editedBlock with block prop when it changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Display mode (non-editing page view)
  // BlockRenderer handles deleted state and wrapper
  if (!isEditing) {
    return <GalleryGrid images={block.content.images} />;
  }

  // Save changes from dialog
  const handleSave = async () => {
    try {
      // Upload all pending files (hook handles old image cleanup)
      const uploadedImages = await uploadAll();

      onUpdate?.({
        ...editedBlock,
        content: { images: uploadedImages },
      });
      setDialogOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  // Cancel changes
  const handleCancel = () => {
    resetImages();
    setEditedBlock(block);
    setDialogOpen(false);
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Edit Image Gallery Block"
        description={`Manage gallery images • ${images.length} of 20 images`}
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
          {images.map((image, index) => {
            const displayUrl = image.previewUrl || image.url;

            return (
              <ImageCard
                key={index}
                ref={(el) => setCardRef(index, el)}
                index={index}
                total={images.length}
                label="Image"
                isHighlighted={highlightedIndex === index}
                canAdd={canAdd}
                canDelete={canRemove}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                onAdd={() => addImageAfter(index)}
                onRemove={() => removeImage(index)}
              >
                {/* Image Preview & Upload */}
                <div className="relative h-32 w-full rounded-lg overflow-hidden border mb-3">
                  {displayUrl ? (
                    <>
                      {image.previewUrl ? (
                        <img
                          src={image.previewUrl}
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
                            if (file) {
                              try {
                                handleImageSelect(index, file);
                              } catch (err) {
                                alert(
                                  err instanceof Error
                                    ? err.message
                                    : "Invalid file"
                                );
                              }
                            }
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
                          if (file) {
                            try {
                              handleImageSelect(index, file);
                            } catch (err) {
                              alert(
                                err instanceof Error
                                  ? err.message
                                  : "Invalid file"
                              );
                            }
                          }
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
                    onChange={(e) => updateAlt(index, e.target.value)}
                    placeholder="Describe the image..."
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(image.alt || "").length}/200 characters
                  </p>
                </Field>
              </ImageCard>
            );
          })}

          {/* Empty state - show Add button only when no images */}
          {images.length === 0 && (
            <Button variant="outline" onClick={addImage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          )}
        </FieldGroup>
      </BlockDialog>

      {/* Display content - wrapper handled by BlockRenderer */}
      <GalleryGrid images={block.content.images} />
    </>
  );
}
