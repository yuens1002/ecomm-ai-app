"use client";

import { LocationBlock as LocationBlockType } from "@/lib/blocks/schemas";
import { MapPinned, Trash2, Plus, X, Clock, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { ImageCarousel } from "@/components/app-components/ImageCarousel";
import { EditableBlockWrapper } from "./EditableBlockWrapper";
import { BlockDialog } from "./BlockDialog";
import { ImageListField } from "@/components/app-components/ImageListField";
import { useMultiImageUpload } from "@/hooks/useImageUpload";

interface LocationBlockProps {
  block: LocationBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: LocationBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function LocationBlock({
  block,
  isEditing,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: LocationBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedBlock, setEditedBlock] = useState(block);
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>(
    {}
  );

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
  });

  // Sync editedBlock when block prop changes (after save)
  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="Location"
        onRestore={onRestore}
      >
        <LocationDisplay block={block} />
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
  if (!isEditing) {
    return <LocationDisplay block={block} />;
  }

  // Validation
  const validateBlock = (): boolean => {
    const newErrors: { [key: string]: string | undefined } = {};

    if (!editedBlock.content.name?.trim()) {
      newErrors.name = "Location name is required";
    }
    if (!editedBlock.content.address?.trim()) {
      newErrors.address = "Address is required";
    }
    if (!editedBlock.content.googleMapsUrl?.trim()) {
      newErrors.googleMapsUrl = "Google Maps URL is required";
    } else {
      try {
        new URL(editedBlock.content.googleMapsUrl);
      } catch {
        newErrors.googleMapsUrl = "Must be a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save changes from dialog
  const handleSave = async () => {
    if (!validateBlock()) return;

    try {
      // Upload all pending files (hook handles old image cleanup)
      const uploadedImages = await uploadAll();

      onUpdate?.({
        ...editedBlock,
        content: { ...editedBlock.content, images: uploadedImages },
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  // Cancel changes
  const handleCancel = () => {
    resetImages();
    setEditedBlock(block);
    setErrors({});
    setIsDialogOpen(false);
  };

  // Handle dialog close
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    } else {
      setIsDialogOpen(open);
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
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
        title="Edit Location"
        description="Configure location details, hours, photos, and description"
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
                if (errors.name) setErrors({ ...errors, name: undefined });
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
                if (errors.address)
                  setErrors({ ...errors, address: undefined });
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
              onChange={(e) =>
                setEditedBlock({
                  ...editedBlock,
                  content: {
                    ...editedBlock.content,
                    googleMapsUrl: e.target.value,
                  },
                })
              }
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

      {/* Editing mode - clickable card */}
      <EditableBlockWrapper
        onEdit={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
        editButtons={
          onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(block.id);
              }}
              className="shadow-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )
        }
      >
        <LocationDisplay block={block} isEditing={true} />
      </EditableBlockWrapper>
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
      className={`relative w-full ${isEditing ? "hover:ring-1 hover:ring-[#00d4ff] transition-all" : ""}`}
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
          <div>
            <h2 className="text-3xl font-bold mb-4">{block.content.name}</h2>

            {/* Address with map link */}
            <div className="flex items-start gap-2 mb-3">
              <MapPinned className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              <a
                href={
                  block.content.googleMapsUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(block.content.address)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => isEditing && e.stopPropagation()}
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                {block.content.address}
              </a>
            </div>

            {/* Phone */}
            {block.content.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${block.content.phone}`}
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  {block.content.phone}
                </a>
              </div>
            )}
          </div>

          {/* Hours */}
          {block.content.schedule && block.content.schedule.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hours
              </h3>
              <div className="space-y-1">
                {block.content.schedule.map((entry, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{entry.day}</span>
                    <span className="font-medium">{entry.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {block.content.description && (
            <p className="text-muted-foreground">{block.content.description}</p>
          )}
        </div>
      </div>
      ``
    </div>
  );
}
