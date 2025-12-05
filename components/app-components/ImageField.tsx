"use client";

import { useId } from "react";
import Image from "next/image";
import { Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup } from "@/components/ui/field";
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
  /** Called when a file is selected. When using useImageUpload hook, only file is needed. */
  onFileSelect: (file: File, previewUrl?: string) => void;
  /** Error message to display */
  error?: string;
  /** Whether the field value is dirty (changed from original) */
  isDirty?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Accept attribute for file input */
  accept?: string;
  /** Height of the preview area (Tailwind class) */
  previewHeight?: string;
  /** Alt text value */
  altText?: string;
  /** Called when alt text changes */
  onAltTextChange?: (alt: string) => void;
  /** Whether to show alt text field */
  showAltText?: boolean;
  /** Alt text placeholder */
  altTextPlaceholder?: string;
  /** Max length for alt text */
  altTextMaxLength?: number;
  /** Error for alt text field */
  altTextError?: string;
  /** Hide the label (useful when used inside ImageListField) */
  hideLabel?: boolean;
}

/**
 * ImageField - Standardized single image upload field with deferred upload pattern
 *
 * Layout:
 * 1. Label (FormHeading with required/dirty/error states)
 * 2. Readonly input showing filename + Upload button
 * 3. Alt text input (optional)
 * 4. Image preview
 *
 * Features:
 * - FormHeading with validation states (required, dirty, error)
 * - Hidden file input + Upload button pattern
 * - Readonly path display showing filename
 * - Optional alt text field with character count
 * - Image preview with placeholder
 * - File validation (size, type)
 * - Deferred upload (stores file locally, uploads on form save)
 *
 * Usage with useImageUpload hook:
 * ```tsx
 * const { pendingFile, previewUrl, isDirty, handleFileSelect, uploadFile } =
 *   useImageUpload({ currentUrl: block.content.imageUrl });
 *
 * <ImageField
 *   label="Hero Image"
 *   required
 *   value={block.content.imageUrl}
 *   pendingFile={pendingFile}
 *   previewUrl={previewUrl}
 *   onFileSelect={handleFileSelect}
 *   altText={block.content.imageAlt}
 *   onAltTextChange={(alt) => setBlock({ ...block, content: { ...block.content, imageAlt: alt } })}
 *   showAltText
 *   error={errors.imageUrl}
 *   isDirty={isDirty}
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
  error,
  isDirty = false,
  placeholder = "Click upload to select an image",
  maxSizeMB = 5,
  accept = "image/*",
  previewHeight = "h-48",
  altText = "",
  onAltTextChange,
  showAltText = false,
  altTextPlaceholder = "Describe this image for accessibility",
  altTextMaxLength = 125,
  altTextError,
  hideLabel = false,
}: ImageFieldProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const fileInputId = `${fieldId}-file`;
  const altTextId = `${fieldId}-alt`;

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

    // Create preview URL for backward compatibility (components not using the hook)
    const objectUrl = URL.createObjectURL(file);

    // Notify parent
    onFileSelect(file, objectUrl);
  };

  // Determine what to display
  const displayUrl = previewUrl || value;

  // Format display path to be human-readable
  const getDisplayPath = () => {
    if (pendingFile) return pendingFile.name;
    if (!value) return "";

    // For placehold.co URLs, show "Placeholder image"
    if (value.includes("placehold.co")) {
      return "Placeholder image";
    }

    // For uploaded files, show just the filename
    return value.split("/").pop() || value;
  };

  const displayPath = getDisplayPath();

  return (
    <FieldGroup>
      {/* Image Upload Field */}
      <Field>
        {/* Label */}
        {!hideLabel && (
          <FormHeading
            htmlFor={fieldId}
            label={label}
            required={required}
            validationType={error ? "error" : undefined}
            isDirty={isDirty}
            errorMessage={error}
          />
        )}

        {/* Path Input with Upload Button */}
        <div className="flex gap-2">
          <Input
            id={fieldId}
            value={displayPath}
            readOnly
            placeholder={placeholder}
            className={`cursor-default flex-1 bg-muted/50 ${error ? "border-destructive" : ""}`}
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
          <input
            id={fileInputId}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Image Preview - part of the image field */}
        <div
          className={`relative ${previewHeight} w-full rounded-lg overflow-hidden border bg-muted/25`}
        >
          {displayUrl ? (
            previewUrl ? (
              // Pending file preview (uses object URL)
              <img
                src={previewUrl}
                alt={altText || "Preview"}
                className="w-full h-full object-cover"
              />
            ) : (
              // Saved image preview (uses Next.js Image)
              <Image
                src={value}
                alt={altText || "Preview"}
                fill
                className="object-cover"
              />
            )
          ) : (
            // Empty state / upload placeholder
            <label
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              htmlFor={fileInputId}
            >
              <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No image selected</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Max {maxSizeMB}MB
              </p>
            </label>
          )}
        </div>
      </Field>

      {/* Alt Text Field */}
      {showAltText && (
        <Field>
          <FormHeading
            htmlFor={altTextId}
            label="Alt Text"
            required
            validationType={altTextError ? "error" : undefined}
            errorMessage={altTextError}
          />
          <div className="relative">
            <Input
              id={altTextId}
              value={altText}
              onChange={(e) => onAltTextChange?.(e.target.value)}
              placeholder={altTextPlaceholder}
              maxLength={altTextMaxLength}
              className={altTextError ? "border-destructive pr-16" : "pr-16"}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              {altText.length}/{altTextMaxLength}
            </span>
          </div>
        </Field>
      )}
    </FieldGroup>
  );
}
