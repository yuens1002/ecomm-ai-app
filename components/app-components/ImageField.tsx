"use client";

import { useId } from "react";
import Image from "next/image";
import { Upload, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";

interface ImageFieldProps {
  /** Unique identifier for the field (used for id/htmlFor) */
  id?: string;
  /** Label text for the form field */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Current saved image URL */
  value: string;
  /** File pending upload (not yet saved) */
  pendingFile?: File | null;
  /** Preview URL for the pending file */
  previewUrl?: string | null;
  /** Called when a file is selected */
  onFileSelect: (file: File, previewUrl: string) => void;
  /** Called when the image is cleared/removed */
  onClear?: () => void;
  /** Error message to display */
  error?: string;
  /** Whether the field value is dirty (changed from original) */
  isDirty?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Alt text for the preview image */
  previewAlt?: string;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Accept attribute for file input */
  accept?: string;
  /** Height of the preview area (Tailwind class) */
  previewHeight?: string;
  /** Show the path in a readonly input */
  showPath?: boolean;
}

/**
 * ImageField - Standardized image upload field with deferred upload pattern
 *
 * Features:
 * - FormHeading with validation states (required, dirty, error)
 * - Hidden file input + Upload button pattern
 * - Optional readonly path display
 * - Image preview with placeholder
 * - File validation (size, type)
 * - Deferred upload (stores file locally, uploads on form save)
 *
 * Usage:
 * ```tsx
 * <ImageField
 *   label="Hero Image"
 *   required
 *   value={block.content.imageUrl}
 *   pendingFile={pendingFile}
 *   previewUrl={previewUrl}
 *   onFileSelect={(file, preview) => {
 *     setPendingFile(file);
 *     setPreviewUrl(preview);
 *   }}
 *   onClear={() => {
 *     setPendingFile(null);
 *     setPreviewUrl(null);
 *   }}
 *   error={errors.imageUrl}
 *   isDirty={pendingFile !== null || value !== originalValue}
 * />
 * ```
 */
export function ImageField({
  id,
  label,
  required = false,
  value,
  pendingFile,
  previewUrl,
  onFileSelect,
  onClear,
  error,
  isDirty = false,
  placeholder = "Click upload button to select an image",
  previewAlt = "Preview",
  maxSizeMB = 5,
  accept = "image/*",
  previewHeight = "h-48",
  showPath = true,
}: ImageFieldProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const fileInputId = `${fieldId}-file`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("File must be an image");
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);

    // Notify parent
    onFileSelect(file, objectUrl);
  };

  const handleClear = () => {
    // Revoke preview URL to free memory
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClear?.();
  };

  // Determine what to display
  const displayUrl = previewUrl || value;
  const displayPath = pendingFile ? pendingFile.name : value;

  return (
    <div className="space-y-3">
      {/* Path Input with Upload Button */}
      {showPath && (
        <Field>
          <FormHeading
            htmlFor={fieldId}
            label={label}
            required={required}
            validationType={error ? "error" : undefined}
            isDirty={isDirty}
            errorMessage={error}
          />
          <div className="flex gap-2">
            <Input
              id={fieldId}
              value={displayPath}
              readOnly
              placeholder={placeholder}
              className={`cursor-default flex-1 ${error ? "border-destructive" : ""}`}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById(fileInputId)?.click()}
              type="button"
              title="Upload image"
            >
              <Upload className="h-4 w-4" />
            </Button>
            {displayUrl && onClear && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleClear}
                type="button"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <input
              id={fileInputId}
              type="file"
              accept={accept}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </Field>
      )}

      {/* Label only (when showPath is false) */}
      {!showPath && (
        <FormHeading
          htmlFor={fileInputId}
          label={label}
          required={required}
          validationType={error ? "error" : undefined}
          isDirty={isDirty}
          errorMessage={error}
        />
      )}

      {/* Image Preview */}
      <div
        className={`relative ${previewHeight} w-full rounded-lg overflow-hidden border`}
      >
        {displayUrl ? (
          <>
            {previewUrl ? (
              // Pending file preview (uses object URL)
              <img
                src={previewUrl}
                alt={previewAlt}
                className="w-full h-full object-cover"
              />
            ) : (
              // Saved image preview (uses Next.js Image)
              <Image
                src={value}
                alt={previewAlt}
                fill
                className="object-cover"
              />
            )}
            {/* Upload overlay on hover */}
            {!showPath && (
              <label
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/0 hover:bg-black/40 transition-colors group"
                htmlFor={fileInputId}
              >
                <Upload className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                <input
                  id={fileInputId}
                  type="file"
                  accept={accept}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
            {/* Remove button */}
            {!showPath && onClear && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          // Empty state / upload placeholder
          <label
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed border-muted-foreground/25 rounded-lg"
            htmlFor={showPath ? fileInputId : fileInputId}
          >
            <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {showPath ? "No image selected" : "Click to upload"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Max {maxSizeMB}MB
            </p>
            {!showPath && (
              <input
                id={fileInputId}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
              />
            )}
          </label>
        )}
      </div>
    </div>
  );
}
