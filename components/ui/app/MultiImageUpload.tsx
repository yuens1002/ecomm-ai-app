"use client";

import Image from "next/image";
import { ImageIcon, Plus, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageItem {
  url: string;
  alt?: string;
  previewUrl?: string;
  pendingFile?: File;
}

interface MultiImageUploadProps {
  images: ImageItem[];
  onImageSelect: (index: number, file: File) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  maxImages?: number;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  maxSizeMB?: number;
  aspectRatio?: "square" | "video" | "portrait" | "landscape";
}

/**
 * Reusable multi-image upload component with grid layout
 * Only shows uploaded images, no empty slots
 * One-click to add, hover to see replace/delete controls
 */
export function MultiImageUpload({
  images,
  onImageSelect,
  onRemove,
  onAdd,
  maxImages = 10,
  columns = 4,
  maxSizeMB = 5,
  aspectRatio = "square",
}: MultiImageUploadProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-5",
    6: "grid-cols-3 md:grid-cols-6",
  } as const;

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  } as const;

  const handleFileChange = (index: number, file: File | undefined) => {
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }

    onImageSelect(index, file);
  };

  const displayUrl = (image: ImageItem) => image.previewUrl || image.url;
  const uploadedImages = images.filter((img) => displayUrl(img));
  const canAddMore = uploadedImages.length < maxImages;

  return (
    <div className={cn("grid gap-4", columnClasses[columns])}>
      {/* Only show uploaded images with previews - no empty slots */}
      {uploadedImages.map((image, displayIndex) => {
        const actualIndex = images.indexOf(image);
        const url = displayUrl(image);
        const fileName =
          image.pendingFile?.name || image.url.split("/").pop() || "";

        return (
          <div
            key={actualIndex}
            className={cn(
              "relative group rounded-lg overflow-hidden border border-border",
              aspectClasses[aspectRatio]
            )}
          >
            <div className="absolute inset-0">
              <Image
                src={url}
                alt={image.alt || `Image ${displayIndex + 1}`}
                fill
                className="object-cover"
              />
            </div>

            {/* Filename badge at bottom - always visible with strong background */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm py-2 px-2">
              <p
                className="text-white text-[11px] font-medium leading-tight truncate drop-shadow-md"
                title={fileName}
              >
                {fileName}
              </p>
            </div>

            {/* Action buttons - only visible on hover */}
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white hover:bg-white/90 shadow-lg"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    handleFileChange(actualIndex, file);
                  };
                  input.click();
                }}
                title="Replace image"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8 shadow-lg"
                onClick={() => onRemove(actualIndex)}
                title="Delete image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      {/* Add Image Button - Opens file picker directly */}
      {canAddMore && (
        <label
          className={cn(
            "relative rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 hover:border-primary/50 hover:border-primary transition-all cursor-pointer group",
            aspectClasses[aspectRatio]
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-md">
                <Plus className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground mt-3 font-medium transition-colors">
              Add Image
            </span>
            <span className="text-xs text-muted-foreground/60 mt-1">
              {uploadedImages.length} / {maxImages}
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileChange(images.length, file);
                onAdd();
              }
            }}
          />
        </label>
      )}
    </div>
  );
}
