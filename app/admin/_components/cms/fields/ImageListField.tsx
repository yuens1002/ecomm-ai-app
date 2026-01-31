"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { ImageField } from "./ImageField";
import { ImageCard } from "./ImageCard";

export interface ImageItem {
  url: string;
  alt: string;
}

interface PendingImage {
  file: File;
  previewUrl: string;
}

interface ImageListFieldProps {
  /** Label for the image list section */
  label: string;
  /** Current list of images */
  images: ImageItem[];
  /** Called when images change (add, remove, reorder, update alt) */
  onChange: (images: ImageItem[]) => void;
  /** Map of pending files by index */
  pendingFiles?: Map<number, PendingImage>;
  /** Called when a file is selected for an index */
  onFileSelect?: (index: number, file: File, previewUrl: string) => void;
  /** Called when a pending file is removed */
  onPendingRemove?: (index: number) => void;
  /** Minimum number of images required */
  minImages?: number;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Height of preview area (Tailwind class) */
  previewHeight?: string;
  /** Whether to show alt text fields */
  showAltText?: boolean;
  /** Error messages by field key (e.g., "0-image", "1-alt") */
  errors?: Record<string, string>;
  /** Whether the list is required (at least one image) */
  required?: boolean;
  /** Error message for the list itself */
  error?: string;
}

/**
 * ImageListField - Multi-image upload using ImageField composition
 *
 * Features:
 * - Composes ImageField for each image (consistent single-image UX)
 * - Card wrapper with reorder controls (up/down arrows)
 * - Add new image button
 * - Delete image button per card
 * - FormHeading for the list label
 * - Deferred upload pattern (parent handles actual uploads)
 *
 * Layout per card:
 * - Card header: Image #{n}, up/down arrows, delete button
 * - ImageField (filename input, alt text, preview)
 *
 * Usage:
 * ```tsx
 * const [images, setImages] = useState<ImageItem[]>([]);
 * const [pendingFiles, setPendingFiles] = useState<Map<number, PendingImage>>(new Map());
 *
 * <ImageListField
 *   label="Photos"
 *   images={images}
 *   onChange={setImages}
 *   pendingFiles={pendingFiles}
 *   onFileSelect={(index, file, previewUrl) => {
 *     setPendingFiles(prev => new Map(prev).set(index, { file, previewUrl }));
 *   }}
 *   onPendingRemove={(index) => {
 *     setPendingFiles(prev => { const next = new Map(prev); next.delete(index); return next; });
 *   }}
 *   showAltText
 * />
 * ```
 */
export function ImageListField({
  label,
  images,
  onChange,
  pendingFiles = new Map(),
  onFileSelect,
  onPendingRemove,
  minImages = 1,
  maxImages = 20,
  maxSizeMB = 5,
  previewHeight = "h-32",
  showAltText = true,
  errors = {},
  required = false,
  error,
}: ImageListFieldProps) {
  // Track newly added image for highlight animation
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Add a new empty image slot at the end
  const handleAdd = () => {
    if (images.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }
    const newIndex = images.length;
    onChange([...images, { url: "", alt: "" }]);
    // Highlight and scroll to new image
    setHighlightedIndex(newIndex);
    setTimeout(() => {
      cardRefs.current
        .get(newIndex)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    setTimeout(() => setHighlightedIndex(null), 1500);
  };

  // Add a new empty image slot after a specific index
  const handleAddAfter = (index: number) => {
    if (images.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }
    const newIndex = index + 1;
    const newImages = [...images];
    newImages.splice(index + 1, 0, { url: "", alt: "" });
    onChange(newImages);
    // Highlight and scroll to new image
    setHighlightedIndex(newIndex);
    setTimeout(() => {
      cardRefs.current
        .get(newIndex)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    setTimeout(() => setHighlightedIndex(null), 1500);
  };

  // Remove image at index
  const handleRemove = (index: number) => {
    // Revoke preview URL if exists
    const pending = pendingFiles.get(index);
    if (pending) {
      URL.revokeObjectURL(pending.previewUrl);
      onPendingRemove?.(index);
    }

    // Remove from images array
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  // Move image up (swap with previous)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [
      newImages[index],
      newImages[index - 1],
    ];
    onChange(newImages);

    // Swap pending files too
    if (onFileSelect && onPendingRemove) {
      const prevPending = pendingFiles.get(index - 1);
      const currPending = pendingFiles.get(index);

      if (currPending) {
        onFileSelect(index - 1, currPending.file, currPending.previewUrl);
      } else {
        onPendingRemove(index - 1);
      }

      if (prevPending) {
        onFileSelect(index, prevPending.file, prevPending.previewUrl);
      } else {
        onPendingRemove(index);
      }
    }
  };

  // Move image down (swap with next)
  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [
      newImages[index + 1],
      newImages[index],
    ];
    onChange(newImages);

    // Swap pending files too
    if (onFileSelect && onPendingRemove) {
      const currPending = pendingFiles.get(index);
      const nextPending = pendingFiles.get(index + 1);

      if (nextPending) {
        onFileSelect(index, nextPending.file, nextPending.previewUrl);
      } else {
        onPendingRemove(index);
      }

      if (currPending) {
        onFileSelect(index + 1, currPending.file, currPending.previewUrl);
      } else {
        onPendingRemove(index + 1);
      }
    }
  };

  // Update alt text for an image
  const handleAltChange = (index: number, alt: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], alt };
    onChange(newImages);
  };

  // Handle file selection for an image
  const handleFileSelect = (index: number, file: File, previewUrl: string) => {
    onFileSelect?.(index, file, previewUrl);
  };

  return (
    <Field>
      {/* List Label */}
      <FormHeading
        label={label}
        required={required}
        validationType={error ? "error" : undefined}
        errorMessage={error}
      />

      {/* Image Cards */}
      <FieldGroup>
        {images.map((image, index) => {
          const pending = pendingFiles.get(index);

          return (
            <ImageCard
              key={index}
              ref={(el: HTMLDivElement | null) => {
                if (el) cardRefs.current.set(index, el);
                else cardRefs.current.delete(index);
              }}
              index={index}
              total={images.length}
              label="Image"
              isHighlighted={highlightedIndex === index}
              canAdd={images.length < maxImages}
              canDelete={images.length > minImages}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onAdd={() => handleAddAfter(index)}
              onRemove={() => handleRemove(index)}
            >
              <ImageField
                id={`image-${index}`}
                label="Image"
                hideLabel
                value={image.url}
                pendingFile={pending?.file}
                previewUrl={pending?.previewUrl}
                onFileSelect={(file, previewUrl) =>
                  handleFileSelect(index, file, previewUrl || "")
                }
                maxSizeMB={maxSizeMB}
                previewHeight={previewHeight}
                showAltText={showAltText}
                altText={image.alt}
                onAltTextChange={(alt) => handleAltChange(index, alt)}
                error={errors[`${index}-image`]}
                altTextError={errors[`${index}-alt`]}
              />
            </ImageCard>
          );
        })}

        {/* Empty State - show Add button only when empty */}
        {images.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              No images added yet.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </div>
        )}
      </FieldGroup>
    </Field>
  );
}
