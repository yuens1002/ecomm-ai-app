"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Plus, Upload, Trash2, ChevronLeft, ChevronRight, EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  onReorder?: (fromIndex: number, toIndex: number) => void;
  maxImages?: number;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  maxSizeMB?: number;
  aspectRatio?: "square" | "video" | "portrait" | "landscape";
}

/**
 * Reusable multi-image upload component with grid layout.
 * Supports DnD reordering on desktop + dropdown menu for all actions.
 */
export function MultiImageUpload({
  images,
  onImageSelect,
  onRemove,
  onAdd,
  onReorder,
  maxImages = 10,
  columns = 4,
  maxSizeMB = 5,
  aspectRatio = "square",
}: MultiImageUploadProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
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

  // --- DnD state ---
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const [dragVisual, setDragVisual] = useState<{
    dragIndex: number | null;
    dragOverIndex: number | null;
  }>({ dragIndex: null, dragOverIndex: null });

  const handleDragStart = (index: number, e: React.DragEvent) => {
    if (!onReorder) return;
    dragIndexRef.current = index;
    setDragVisual({ dragIndex: index, dragOverIndex: null });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (_index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndexRef.current === null) return;
    if (dragOverIndexRef.current !== _index) {
      dragOverIndexRef.current = _index;
      setDragVisual((prev) => ({ ...prev, dragOverIndex: _index }));
    }
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const from = dragIndexRef.current ?? Number(e.dataTransfer.getData("text/plain"));
    if (from !== null && !isNaN(from) && from !== index && onReorder) {
      onReorder(from, index);
    }
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragVisual({ dragIndex: null, dragOverIndex: null });
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragVisual({ dragIndex: null, dragOverIndex: null });
  };

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

  const triggerFileInput = (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      handleFileChange(index, file);
    };
    input.click();
  };

  const displayUrl = (image: ImageItem) => image.previewUrl || image.url;
  const uploadedImages = images.filter((img) => displayUrl(img));
  const canAddMore = uploadedImages.length < maxImages;
  const isDraggable = !!onReorder && uploadedImages.length > 1;

  return (
    <div className={cn("grid gap-4", columnClasses[columns])}>
      {uploadedImages.map((image, displayIndex) => {
        const actualIndex = images.indexOf(image);
        const url = displayUrl(image);
        const fileName =
          image.pendingFile?.name || image.url.split("/").pop() || "";
        const isDragging = dragVisual.dragIndex === displayIndex;
        const isDragOver = dragVisual.dragOverIndex === displayIndex && dragVisual.dragIndex !== displayIndex;
        const isFirst = displayIndex === 0;
        const isLast = displayIndex === uploadedImages.length - 1;
        const canReorder = !!onReorder && uploadedImages.length > 1;

        return (
          <div
            key={actualIndex}
            draggable={isDraggable}
            onDragStart={(e) => handleDragStart(displayIndex, e)}
            onDragOver={(e) => handleDragOver(displayIndex, e)}
            onDrop={(e) => handleDrop(displayIndex, e)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative group rounded-lg overflow-hidden border border-border select-none",
              aspectClasses[aspectRatio],
              isDragging && "opacity-40",
              isDragOver && "ring-2 ring-primary ring-offset-2",
              isDraggable && "cursor-grab active:cursor-grabbing"
            )}
          >
            {/* Image layer — pointer-events-none so drag events reach the parent */}
            <div className="absolute inset-0 pointer-events-none">
              <Image
                src={url}
                alt={image.alt || `Image ${displayIndex + 1}`}
                fill
                className="object-cover"
                draggable={false}
              />
            </div>

            {/* Filename badge — pointer-events-none so drag works over it */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm py-2 px-2 pointer-events-none">
              <p
                className="text-white text-[11px] font-medium leading-tight truncate drop-shadow-md"
                title={fileName}
              >
                {fileName}
              </p>
            </div>

            {/* Dropdown menu trigger */}
            <div className="absolute top-2 right-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-background/90 hover:bg-background shadow-lg"
                  >
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => triggerFileInput(actualIndex)}>
                    <Upload />
                    Replace image
                  </DropdownMenuItem>
                  {canReorder && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={isFirst}
                        onSelect={() => onReorder!(displayIndex, displayIndex - 1)}
                      >
                        <ChevronLeft />
                        Move previous
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isLast}
                        onSelect={() => onReorder!(displayIndex, displayIndex + 1)}
                      >
                        <ChevronRight />
                        Move next
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onRemove(actualIndex)}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}

      {/* Add Image Button */}
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
              {uploadedImages.length + 1} / {maxImages}
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
