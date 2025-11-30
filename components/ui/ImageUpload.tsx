"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string;
  aspectRatio?: "square" | "video" | "4/3" | "16/9";
  maxSizeMB?: number;
  showPreview?: boolean;
  className?: string;
}

export function ImageUpload({
  onUploadComplete,
  currentImageUrl,
  aspectRatio = "video",
  maxSizeMB = 5,
  showPreview = true,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    "4/3": "aspect-4/3",
    "16/9": "aspect-video",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setPreviewUrl(data.path);
      onUploadComplete(data.path);

      // Reset input
      e.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete("");
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Area or Preview */}
      {!displayUrl ? (
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="image-upload-input"
            className={cn(
              "flex flex-col items-center justify-center w-full border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors",
              aspectClasses[aspectRatio]
            )}
          >
            <div className="flex flex-col items-center justify-center p-6">
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 mb-3 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground font-semibold">
                    Uploading...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WebP (MAX. {maxSizeMB}MB)
                  </p>
                </>
              )}
            </div>
            <input
              id="image-upload-input"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        </div>
      ) : (
        showPreview && (
          <div
            className={cn(
              "relative w-full rounded-lg overflow-hidden border",
              aspectClasses[aspectRatio]
            )}
          >
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )
      )}

      {/* Upload button when preview exists */}
      {displayUrl && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              document.getElementById("image-upload-input")?.click()
            }
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Change Image"}
          </Button>
          <input
            id="image-upload-input"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
      )}
    </div>
  );
}
