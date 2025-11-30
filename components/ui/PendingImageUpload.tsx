"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendingImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImageUrl?: string;
  currentFile?: File;
  onRemove?: () => void;
  aspectRatio?: "square" | "video" | "4/3" | "16/9";
  maxSizeMB?: number;
}

/**
 * Image upload component for pending uploads (doesn't upload until save)
 * Shows preview of selected file or existing URL
 * Used in dialogs where upload should happen on save, not immediately
 */
export function PendingImageUpload({
  onImageSelect,
  currentImageUrl,
  currentFile,
  onRemove,
  aspectRatio = "video",
  maxSizeMB = 5,
}: PendingImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-video",
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Pass file to parent
    onImageSelect(file);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onRemove?.();
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div
      className={`relative w-full ${aspectClasses[aspectRatio]} bg-gray-100 rounded-lg overflow-hidden`}
    >
      {displayUrl ? (
        <>
          <Image
            src={displayUrl}
            alt="Upload preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">Upload Image</span>
          <span className="text-xs text-gray-400 mt-1">Max {maxSizeMB}MB</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
