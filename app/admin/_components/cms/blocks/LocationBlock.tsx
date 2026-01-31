"use client";

import { LocationBlock as LocationBlockType } from "@/lib/blocks/schemas";
import { MapPinned, Plus, X, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { ImageCarousel } from "@/components/shared/media/ImageCarousel";
import { BlockDialog } from "./BlockDialog";
import { ImageListField } from "@/app/admin/_components/cms/fields/ImageListField";
import { useMultiImageUpload } from "@/app/admin/_hooks/useImageUpload";
import { HoursCard } from "@/app/(site)/_components/content/HoursCard";
import { useValidation } from "@/hooks/useFormDialog";

interface LocationBlockProps {
  block: LocationBlockType;
  isEditing: boolean;
  onUpdate?: (block: LocationBlockType) => void;
  /** Page slug for organizing uploaded images */
  pageSlug?: string;
  // Dialog control from BlockRenderer
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function LocationBlock({
  block,
  isEditing,
  onUpdate,
  pageSlug,
  isDialogOpen = false,
  onDialogOpenChange,
}: LocationBlockProps) {
  // For backward compatibility, use internal state if not controlled
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = onDialogOpenChange ? isDialogOpen : internalDialogOpen;
  const setDialogOpen = onDialogOpenChange || setInternalDialogOpen;

  const [editedBlock, setEditedBlock] = useState(block);

  // Use validation hook for error state and toast
  const { errors, hasErrors, clearError, clearAllErrors, showValidationError } =
    useValidation<{
      name?: string;
      address?: string;
      googleMapsUrl?: string;
    }>();

  // Use shared multi-image upload hook
  const {
    uploadAll,
    reset: resetImages,
    // ImageListField compatibility
    imageListFieldImages,
    pendingFilesMap,
    handleImageListFieldFileSelect,
    handleImageListFieldChange,
  } = useMultiImageUpload({
    currentImages: block.content.images || [],
    minImages: 1,
    maxImages: 10,
    pageSlug,
  });

  // Sync editedBlock when block prop changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Display mode (non-editing page view)
  // BlockRenderer handles deleted state and wrapper
  if (!isEditing) {
    return <LocationDisplay block={block} />;
  }

  // Save changes from dialog
  const handleSave = async () => {
    // Validate required fields
    const fieldErrors: {
      name?: string;
      address?: string;
      googleMapsUrl?: string;
    } = {};

    if (!editedBlock.content.name?.trim()) {
      fieldErrors.name = "Location name is required";
    }
    if (!editedBlock.content.address?.trim()) {
      fieldErrors.address = "Address is required";
    }
    if (!editedBlock.content.googleMapsUrl?.trim()) {
      fieldErrors.googleMapsUrl = "Google Maps URL is required";
    } else {
      try {
        new URL(editedBlock.content.googleMapsUrl);
      } catch {
        fieldErrors.googleMapsUrl = "Must be a valid URL";
      }
    }

    // Show toast and set errors if validation fails
    if (!showValidationError(fieldErrors)) {
      return;
    }

    try {
      // Upload all pending files (hook handles old image cleanup)
      const uploadedImages = await uploadAll();

      onUpdate?.({
        ...editedBlock,
        content: { ...editedBlock.content, images: uploadedImages },
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
    clearAllErrors();
    setDialogOpen(false);
  };

  // Handle dialog close
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    } else {
      setDialogOpen(open);
    }
  };

  // Add hour entry
  const addHourEntry = () => {
    setEditedBlock({
      ...editedBlock,
      content: {
        ...editedBlock.content,
        schedule: [
          ...(editedBlock.content.schedule || []),
          { day: "", hours: "" },
        ],
      },
    });
  };

  // Remove hour entry
  const removeHourEntry = (index: number) => {
    setEditedBlock({
      ...editedBlock,
      content: {
        ...editedBlock.content,
        schedule:
          editedBlock.content.schedule?.filter((_, i) => i !== index) || [],
      },
    });
  };

  // Edit mode with dialog
  return (
    <>
      <BlockDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        title="Edit Location"
        description="Configure location details, hours, photos, and description"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={hasErrors}>
              Save
            </Button>
          </>
        }
      >
        <FieldGroup>
          {/* Basic Info */}
          <Field>
            <FormHeading
              htmlFor="location-name"
              label="Location Name"
              required={true}
              validationType={errors.name ? "error" : undefined}
              isDirty={editedBlock.content.name !== block.content.name}
              errorMessage={errors.name}
            />
            <Input
              id="location-name"
              value={editedBlock.content.name}
              onChange={(e) => {
                setEditedBlock({
                  ...editedBlock,
                  content: { ...editedBlock.content, name: e.target.value },
                });
                if (errors.name) clearError("name");
              }}
              placeholder="e.g., Downtown Location"
              maxLength={100}
              className={errors.name ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editedBlock.content.name.length}/100 characters
            </p>
          </Field>

          <Field>
            <FormHeading
              htmlFor="location-address"
              label="Address"
              required={true}
              validationType={errors.address ? "error" : undefined}
              isDirty={editedBlock.content.address !== block.content.address}
              errorMessage={errors.address}
            />
            <Textarea
              id="location-address"
              value={editedBlock.content.address}
              onChange={(e) => {
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    address: e.target.value,
                  },
                });
                if (errors.address) clearError("address");
              }}
              placeholder="123 Main St&#10;City, State 12345"
              rows={3}
              maxLength={500}
              className={errors.address ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editedBlock.content.address.length}/500 characters
            </p>
          </Field>

          <Field>
            <FormHeading
              htmlFor="location-phone"
              label="Phone"
              isDirty={
                (editedBlock.content.phone || "") !==
                (block.content.phone || "")
              }
            />
            <Input
              id="location-phone"
              value={editedBlock.content.phone || ""}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    phone: e.target.value,
                  },
                })
              }
              placeholder="(555) 123-4567"
              maxLength={50}
            />
          </Field>

          <Field>
            <FormHeading
              htmlFor="location-maps"
              label="Google Maps URL"
              required
              isDirty={
                (editedBlock.content.googleMapsUrl || "") !==
                (block.content.googleMapsUrl || "")
              }
              validationType={errors.googleMapsUrl ? "error" : undefined}
              errorMessage={errors.googleMapsUrl}
            />
            <Input
              id="location-maps"
              value={editedBlock.content.googleMapsUrl || ""}
              onChange={(e) => {
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    googleMapsUrl: e.target.value,
                  },
                });
                if (errors.googleMapsUrl) clearError("googleMapsUrl");
              }}
              placeholder="https://maps.google.com/..."
              className={errors.googleMapsUrl ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Open Google Maps, search your address, click Share → Copy link
            </p>
          </Field>

          {/* Description */}
          <Field>
            <FormHeading
              htmlFor="location-description"
              label="Description"
              isDirty={
                (editedBlock.content.description || "") !==
                (block.content.description || "")
              }
            />
            <Textarea
              id="location-description"
              value={editedBlock.content.description || ""}
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    description: e.target.value,
                  },
                })
              }
              placeholder="Describe this location..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(editedBlock.content.description || "").length}/2000 characters
            </p>
          </Field>

          {/* Hours */}
          <Field>
            <FormHeading htmlFor="location-hours" label="Hours" />
            <div className="space-y-2">
              {editedBlock.content.schedule?.map((entry, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={entry.day}
                    onChange={(e) => {
                      const newSchedule = [
                        ...(editedBlock.content.schedule || []),
                      ];
                      newSchedule[index] = {
                        ...entry,
                        day: e.target.value,
                      };
                      setEditedBlock({
                        ...editedBlock,
                        content: {
                          ...editedBlock.content,
                          schedule: newSchedule,
                        },
                      });
                    }}
                    placeholder="Day(s)"
                    className="flex-1"
                    maxLength={50}
                  />
                  <Input
                    value={entry.hours}
                    onChange={(e) => {
                      const newSchedule = [
                        ...(editedBlock.content.schedule || []),
                      ];
                      newSchedule[index] = {
                        ...entry,
                        hours: e.target.value,
                      };
                      setEditedBlock({
                        ...editedBlock,
                        content: {
                          ...editedBlock.content,
                          schedule: newSchedule,
                        },
                      });
                    }}
                    placeholder="Hours"
                    className="flex-1"
                    maxLength={50}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHourEntry(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHourEntry}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Hours
              </Button>
            </div>
          </Field>

          {/* Images */}
          <ImageListField
            label="Photos"
            required
            minImages={1}
            images={imageListFieldImages}
            onChange={handleImageListFieldChange}
            pendingFiles={pendingFilesMap}
            onFileSelect={handleImageListFieldFileSelect}
          />
        </FieldGroup>
      </BlockDialog>

      {/* Display content - wrapper handled by BlockRenderer */}
      <LocationDisplay block={block} isEditing={true} />
    </>
  );
}

// Display component for consistent rendering
function LocationDisplay({
  block,
  isEditing = false,
}: {
  block: LocationBlockType;
  isEditing?: boolean;
}) {
  // Create ID for anchor linking from carousel
  const locationId = `location-${block.content.name.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      id={locationId}
      data-block-id={block.id}
      data-location-name={block.content.name}
      className="relative w-full"
    >
      {/* 50/50 Split Layout - md, 60/40 Split Layout - lg+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Photo Gallery */}
        <div className="md:col-span-1 lg:col-span-3">
          <ImageCarousel
            images={block.content.images || []}
            aspectRatio="4/3"
            defaultAlt={block.content.name}
            fallbackIcon={
              <MapPinned className="h-12 w-12 text-muted-foreground" />
            }
          />
        </div>

        {/* Location Info */}
        <div className="md:col-span-1 lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">{block.content.name}</h2>

            {/* Address with map link */}
            <Button
              asChild
              variant="link"
              className="p-0 h-auto text-lg text-muted-foreground justify-start has-[>svg]:px-0 whitespace-normal text-left"
            >
              <a
                href={
                  block.content.googleMapsUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.content.address)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => isEditing && e.stopPropagation()}
              >
                <MapPinned className="h-4 w-4 shrink-0" />
                {block.content.address}
              </a>
            </Button>

            {/* Phone */}
            {block.content.phone && (
              <Button
                asChild
                variant="link"
                className="p-0 h-auto text-lg text-muted-foreground justify-start has-[>svg]:px-0 whitespace-normal text-left"
              >
                <a href={`tel:${block.content.phone}`}>
                  <Phone className="h-4 w-4" />
                  {block.content.phone}
                </a>
              </Button>
            )}
          </div>

          {/* Hours */}
          {block.content.schedule && block.content.schedule.length > 0 && (
            <HoursCard schedule={block.content.schedule} variant="inline" />
          )}

          {/* Description */}
          {block.content.description && (
            <div className="prose">
              <p>{block.content.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
