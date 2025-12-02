"use client";

import { LocationBlock as LocationBlockType } from "@/lib/blocks/schemas";
import { MapPinned, Trash2, Plus, X, Clock, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/ImageUpload";

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save changes from dialog
  const handleSave = () => {
    if (!validateBlock()) return;

    // No need to upload images - they're uploaded immediately on selection
    // Just save the edited block
    onUpdate?.(editedBlock);
    setIsDialogOpen(false);
  };

  // Cancel changes
  const handleCancel = () => {
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

  // Remove image
  const removeImage = (index: number) => {
    setEditedBlock({
      ...editedBlock,
      content: {
        ...editedBlock.content,
        images: editedBlock.content.images?.filter((_, i) => i !== index) || [],
      },
    });
  };

  // Edit mode with dialog
  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pr-8 flex-shrink-0">
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Configure location details, hours, photos, and description
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <FieldGroup>
              {/* Basic Info */}
              <Field>
                <FormHeading
                  htmlFor="location-name"
                  label="Location Name"
                  required={true}
                  validationType={errors.name ? "error" : undefined}
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
              </Field>

              <Field>
                <FormHeading
                  htmlFor="location-address"
                  label="Address"
                  required={true}
                  validationType={errors.address ? "error" : undefined}
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
              </Field>

              <Field>
                <FormHeading htmlFor="location-phone" label="Phone" />
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
                <FormHeading htmlFor="location-maps" label="Google Maps URL" />
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
                />
              </Field>

              {/* Description */}
              <Field>
                <FormHeading
                  htmlFor="location-description"
                  label="Description"
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
                  {(editedBlock.content.description || "").length}/2000
                  characters
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
              <Field>
                <FormHeading htmlFor="location-photos" label="Photos" />
                <div className="space-y-4">
                  {/* Image grid with previews */}
                  {editedBlock.content.images &&
                    editedBlock.content.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {editedBlock.content.images.map((img, index) => (
                          <div
                            key={index}
                            className="relative aspect-4/3 rounded-lg overflow-hidden border"
                          >
                            <Image
                              src={img.url}
                              alt={img.alt || "Location photo"}
                              fill
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-7 w-7 p-0"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Upload new image */}
                  <ImageUpload
                    onUploadComplete={(url) => {
                      setEditedBlock({
                        ...editedBlock,
                        content: {
                          ...editedBlock.content,
                          images: [
                            ...(editedBlock.content.images || []),
                            { url, alt: "Location photo" },
                          ],
                        },
                      });
                    }}
                    aspectRatio="4/3"
                    showPreview={false}
                  />
                </div>
              </Field>
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-2 mt-6 flex-shrink-0">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editing mode - clickable card */}
      <div
        className="cursor-pointer group"
        onClick={() => {
          if (onSelect) onSelect();
          setIsDialogOpen(true);
        }}
      >
        <LocationDisplay block={block} isEditing={true} />

        {/* Action Buttons on Hover */}
        <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(block.id);
            }}
            className="shadow-lg"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasImages = block.content.images && block.content.images.length > 0;

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
          {hasImages ? (
            <div className="relative aspect-4/3 rounded-lg overflow-hidden">
              <Image
                src={block.content.images![currentImageIndex].url}
                alt={
                  block.content.images![currentImageIndex].alt ||
                  block.content.name
                }
                fill
                className="object-cover"
              />

              {/* Image navigation dots */}
              {block.content.images!.length > 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 flex gap-2">
                  {block.content.images!.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "bg-white w-8"
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-4/3 rounded-lg bg-muted flex items-center justify-center">
              <MapPinned className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Location Info */}
        <div className="md:col-span-1 lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-4">{block.content.name}</h2>

            {/* Address with map link */}
            <div className="flex items-start gap-2 mb-3">
              <MapPinned className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
              {block.content.googleMapsUrl ? (
                <a
                  href={block.content.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => isEditing && e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  {block.content.address}
                </a>
              ) : (
                <address className="not-italic text-muted-foreground">
                  {block.content.address}
                </address>
              )}
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
