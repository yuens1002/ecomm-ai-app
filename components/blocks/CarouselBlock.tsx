"use client";

import { useState, useEffect, useRef } from "react";
import {
  ImageCarouselBlock,
  LocationCarouselBlock,
} from "@/lib/blocks/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, X, ArrowRight, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";
import { PendingImageUpload } from "@/components/ui/PendingImageUpload";
import { CarouselDots } from "@/components/app-components/CarouselDots";

type CarouselBlockType = ImageCarouselBlock | LocationCarouselBlock;

interface CarouselBlockProps {
  block: CarouselBlockType;
  isEditing: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: CarouselBlockType) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

export function CarouselBlock({
  block,
  isEditing,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: CarouselBlockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Deleted/disabled state
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName="Carousel"
        onRestore={onRestore}
      >
        <CarouselDisplay block={block} />
      </DeletedBlockOverlay>
    );
  }

  // Display mode (non-editing page view)
  if (!isEditing) {
    return <CarouselDisplay block={block} />;
  }

  // Empty state in edit mode
  if (block.content.slides.length === 0) {
    return (
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        )}
        onClick={onSelect}
      >
        <p className="text-gray-500 mb-4">No slides in carousel</p>
        <EditCarouselDialog
          block={block}
          onUpdate={onUpdate}
          trigger={
            <Button variant="outline" onClick={(e) => e.stopPropagation()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Slides
            </Button>
          }
        />
      </div>
    );
  }

  // Edit mode with content
  return (
    <div
      className={cn(
        "relative rounded-lg transition-all cursor-pointer",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onSelect}
    >
      {/* Carousel Display */}
      <CarouselDisplay block={block} />

      {/* Edit Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <EditCarouselDialog
          block={block}
          onUpdate={onUpdate}
          trigger={
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          }
        />
        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Carousel Display Component
 * Handles the visual presentation and auto-scroll logic
 */
function CarouselDisplay({ block }: { block: CarouselBlockType }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { slides, autoScroll, intervalSeconds } = block.content;

  // Auto-scroll logic
  useEffect(() => {
    if (!autoScroll || slides.length <= 1 || isHovered) {
      return;
    }

    autoScrollTimerRef.current = setInterval(
      () => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      },
      (intervalSeconds || 5) * 1000
    );

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [autoScroll, intervalSeconds, slides.length, isHovered]);

  // Scroll to current slide
  useEffect(() => {
    if (scrollContainerRef.current && slides.length > 0) {
      const container = scrollContainerRef.current;
      const slideWidth = container.scrollWidth / slides.length;
      container.scrollTo({
        left: slideWidth * currentSlideIndex,
        behavior: "smooth",
      });
    }
  }, [currentSlideIndex, slides.length]);

  const handleSlideClick = (slide: any) => {
    if (block.type === "locationCarousel" && slide.locationBlockId) {
      // Use the locationBlockId to find the corresponding location block
      const element = document.querySelector(
        `[data-block-id="${slide.locationBlockId}"]`
      );

      if (element) {
        // Get the absolute position of the element
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;

        // Scroll to the element position with breathing room at the top
        const targetPosition = absoluteElementTop - 100;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* TODO: Add optional hero background image overlay (includeHero, heroImageUrl, heroImageAlt) */}

      {/* Carousel Container */}
      {/* TODO: Implement infinite scroll with 5x slide duplication for seamless looping */}
      <div
        ref={scrollContainerRef}
        className="flex px-4 gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {slides.map((slide: any, index: number) => (
          <div
            key={index}
            className="shrink-0 snap-start"
            style={{
              width: "calc((100% - 2rem) / 2.5)", // ~2.5 cards visible
              minWidth: "280px",
            }}
          >
            <div
              className="relative group cursor-pointer"
              onClick={
                block.type === "locationCarousel"
                  ? () => handleSlideClick(slide)
                  : undefined
              }
            >
              {/* Image */}
              <div className="relative aspect-4/3 rounded-lg overflow-hidden">
                <Image
                  src={slide.url}
                  alt={slide.alt || "Carousel image"}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />

                {/* Hours & Location Button - Bottom Right */}
                {block.type === "locationCarousel" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlideClick(slide);
                    }}
                    className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 hover:bg-white text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                  >
                    Hours & Location
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Location Preview Content */}
              {block.type === "locationCarousel" && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-xl font-semibold">{slide.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {slide.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dot Navigation */}
      {slides.length > 1 && (
        <div className="flex justify-center mt-10">
          <CarouselDots
            total={slides.length}
            currentIndex={currentSlideIndex}
            onDotClick={setCurrentSlideIndex}
          />
        </div>
      )}
    </div>
  );
}

interface EditCarouselDialogProps {
  block: CarouselBlockType;
  onUpdate?: (block: CarouselBlockType) => void;
  trigger: React.ReactNode;
}

type SlideUnit = {
  type: "image" | "locationPreview";
  url: string;
  alt: string;
  title?: string;
  description?: string;
  locationBlockId?: string; // Required for locationPreview (1-to-1 relationship)
  pendingFile?: File;
  previewUrl?: string;
};

function EditCarouselDialog({
  block,
  onUpdate,
  trigger,
}: EditCarouselDialogProps) {
  const [open, setOpen] = useState(false);
  const [carouselType, setCarouselType] = useState<
    "image" | "locationPreview" | null
  >(null);
  const [slideUnits, setSlideUnits] = useState<SlideUnit[]>([]);
  const [autoScroll, setAutoScroll] = useState(
    block.content.autoScroll ?? true
  );
  const [intervalSeconds, setIntervalSeconds] = useState(
    block.content.intervalSeconds ?? 5
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available location blocks from the page (for existing blocks only)
  const availableLocations = (() => {
    if (typeof document === "undefined") return [];
    const locationElements = document.querySelectorAll("[data-location-id]");
    return Array.from(locationElements).map((el) => ({
      id: el.getAttribute("data-location-id") || "",
      name: el.getAttribute("data-location-name") || "",
    }));
  })();

  // Initialize dialog state when opened
  useEffect(() => {
    if (open) {
      // Determine type from block.type (imageCarousel or locationCarousel)
      const isLocationCarousel = block.type === "locationCarousel";
      const slideType = isLocationCarousel ? "locationPreview" : "image";
      setCarouselType(slideType);

      const slides = block.content.slides;
      if (slides.length > 0) {
        // Convert slides to units
        const units: SlideUnit[] = slides.map((slide: any) => ({
          type: slideType,
          url: slide.url,
          alt: slide.alt,
          title: isLocationCarousel ? slide.title : undefined,
          description: isLocationCarousel ? slide.description : undefined,
          locationBlockId: isLocationCarousel
            ? slide.locationBlockId
            : undefined,
        }));
        setSlideUnits(units);
      } else {
        // Empty carousel - initialize with one empty slide
        setSlideUnits([
          {
            type: slideType,
            url: "",
            alt: "",
            ...(isLocationCarousel && {
              title: "",
              description: "",
              locationBlockId: undefined,
            }),
          },
        ]);
      }
      setAutoScroll(block.content.autoScroll ?? true);
      setIntervalSeconds(block.content.intervalSeconds ?? 5);
      setErrors({});
    }
  }, [open, block]);

  // Type is now immutable - determined by block.type at creation time

  const handleAddUnit = (afterIndex?: number) => {
    if (!carouselType) return;

    const newUnit: SlideUnit = {
      type: carouselType,
      url: "",
      alt: "",
      ...(carouselType === "locationPreview" && {
        title: "",
        description: "",
        locationBlockId: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for new location block
      }),
    };

    if (afterIndex !== undefined) {
      // Insert after specific index
      const updated = [...slideUnits];
      updated.splice(afterIndex + 1, 0, newUnit);
      setSlideUnits(updated);
    } else {
      // Add to end
      setSlideUnits([...slideUnits, newUnit]);
    }
  };

  const handleRemoveUnit = (index: number) => {
    const unitToRemove = slideUnits[index];

    // If it's a location preview with a location block, we'll mark it for deletion
    // (The actual deletion happens in the parent page editor, not here)
    // For now, just remove from slides

    const updated = slideUnits.filter((_, i) => i !== index);
    setSlideUnits(updated);

    // Note: If locationBlockId is a real ID (not temp-*),
    // the parent component should handle cascading delete
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const updated = [...slideUnits];
      [updated[index - 1], updated[index]] = [
        updated[index],
        updated[index - 1],
      ];
      setSlideUnits(updated);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < slideUnits.length - 1) {
      const updated = [...slideUnits];
      [updated[index], updated[index + 1]] = [
        updated[index + 1],
        updated[index],
      ];
      setSlideUnits(updated);
    }
  };

  const handleImageSelect = (index: number, file: File) => {
    const updated = [...slideUnits];

    // Create preview URL
    if (updated[index].previewUrl) {
      URL.revokeObjectURL(updated[index].previewUrl!);
    }
    const previewUrl = URL.createObjectURL(file);

    updated[index] = {
      ...updated[index],
      pendingFile: file,
      previewUrl,
    };
    setSlideUnits(updated);
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...slideUnits];
    if (updated[index].previewUrl) {
      URL.revokeObjectURL(updated[index].previewUrl!);
    }
    updated[index] = {
      ...updated[index],
      url: "",
      pendingFile: undefined,
      previewUrl: undefined,
    };
    setSlideUnits(updated);
  };

  const handleFieldChange = (
    index: number,
    field: keyof SlideUnit,
    value: any
  ) => {
    const updated = [...slideUnits];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSlideUnits(updated);
  };

  const validateSlides = (): boolean => {
    const newErrors: Record<string, string> = {};

    slideUnits.forEach((unit, index) => {
      // Check image
      if (!unit.url && !unit.pendingFile) {
        newErrors[`${index}-image`] = "Image is required";
      }

      // Check alt text
      if (!unit.alt.trim()) {
        newErrors[`${index}-alt`] = "Alt text is required";
      }

      // Check location preview fields
      if (unit.type === "locationPreview") {
        if (!unit.title?.trim()) {
          newErrors[`${index}-title`] = "Title is required";
        }
        if (!unit.description?.trim()) {
          newErrors[`${index}-description`] = "Description is required";
        }
        if (!unit.locationBlockId) {
          newErrors[`${index}-location`] = "Location block ID is required";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  };

  const handleSave = async () => {
    if (!onUpdate || !carouselType) return;

    // Validate all slides
    if (!validateSlides()) {
      return;
    }

    setIsSaving(true);

    try {
      // Upload all pending images
      const slidesWithUrls = await Promise.all(
        slideUnits.map(async (unit) => {
          let imageUrl = unit.url;

          // Upload pending file if exists
          if (unit.pendingFile) {
            imageUrl = await uploadImage(unit.pendingFile);
          }

          // Clean up preview URL
          if (unit.previewUrl) {
            URL.revokeObjectURL(unit.previewUrl);
          }

          return {
            type: unit.type,
            url: imageUrl,
            alt: unit.alt,
            ...(unit.type === "locationPreview" && {
              title: unit.title!,
              description: unit.description!,
              locationBlockId: unit.locationBlockId!, // Required for locationPreview
            }),
          };
        })
      );

      // Update block
      // Note: Parent component should handle:
      // 1. Creating new location blocks for temp-* IDs
      // 2. Deleting orphaned location blocks
      // 3. Updating existing location blocks
      onUpdate({
        ...block,
        content: {
          includeHero: false, // Hero feature removed but field required by schema
          slides: slidesWithUrls as any,
          autoScroll,
          intervalSeconds,
        },
      });

      setOpen(false);
    } catch (error) {
      console.error("Failed to save carousel:", error);
      alert("Failed to save carousel. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Clean up preview URLs
    slideUnits.forEach((unit) => {
      if (unit.previewUrl) {
        URL.revokeObjectURL(unit.previewUrl);
      }
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pr-8 shrink-0">
          <DialogTitle>Edit Carousel</DialogTitle>
          <DialogDescription>
            {carouselType === "locationPreview"
              ? "Location carousel - add slides and configure settings"
              : "Image carousel - add slides and configure settings"}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-6">
            {/* Carousel Settings - shown first */}
            <div className="space-y-4 border-b pb-6">
              <h3 className="font-semibold">Carousel Settings</h3>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoScroll">Auto-scroll</Label>
                <Switch
                  id="autoScroll"
                  checked={autoScroll}
                  onCheckedChange={setAutoScroll}
                />
              </div>

              {autoScroll && (
                <div>
                  <Label htmlFor="intervalSeconds">
                    Interval: {intervalSeconds} seconds
                  </Label>
                  <Input
                    id="intervalSeconds"
                    type="range"
                    min={2}
                    max={10}
                    value={intervalSeconds}
                    onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            {/* Slide Units */}
            {carouselType && (
              <div className="space-y-4">
                <h3 className="font-semibold">Slides ({slideUnits.length})</h3>

                {/* Slide Units Grid */}
                <div className="space-y-4">
                  {slideUnits.map((unit, index) => (
                    <SlideUnitCard
                      key={index}
                      unit={unit}
                      index={index}
                      type={carouselType}
                      isFirst={index === 0}
                      isLast={index === slideUnits.length - 1}
                      canDelete={slideUnits.length > 1 || index > 0}
                      availableLocations={availableLocations}
                      errors={errors}
                      onImageSelect={(file) => handleImageSelect(index, file)}
                      onRemoveImage={() => handleRemoveImage(index)}
                      onFieldChange={(field, value) =>
                        handleFieldChange(index, field, value)
                      }
                      onMoveUp={() => handleMoveUp(index)}
                      onMoveDown={() => handleMoveDown(index)}
                      onRemove={() => handleRemoveUnit(index)}
                      onAdd={() => handleAddUnit(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !carouselType}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SlideUnitCardProps {
  unit: SlideUnit;
  index: number;
  type: "image" | "locationPreview";
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
  availableLocations: { id: string; name: string }[];
  errors: Record<string, string>;
  onImageSelect: (file: File) => void;
  onRemoveImage: () => void;
  onFieldChange: (field: keyof SlideUnit, value: any) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onAdd: () => void;
}

function SlideUnitCard({
  unit,
  index,
  type,
  isFirst,
  isLast,
  canDelete,
  availableLocations,
  errors,
  onImageSelect,
  onRemoveImage,
  onFieldChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAdd,
}: SlideUnitCardProps) {
  const displayUrl = unit.previewUrl || unit.url;
  const isNewLocation = unit.locationBlockId?.startsWith("temp-");

  return (
    <div className="border rounded-lg p-4 bg-card">
      {/* Header with position controls */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          Slide {index + 1}
          {type === "locationPreview" && (
            <span className="ml-2 text-xs text-primary">
              {isNewLocation
                ? "(New Location Block)"
                : "(Linked to Location Block)"}
            </span>
          )}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={isFirst}
          >
            <span className="sr-only">Move slide up</span>↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={isLast}
          >
            <span className="sr-only">Move slide down</span>↓
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
            <span className="sr-only">Add slide after this one</span>
            <Plus className="w-4 h-4" />
          </Button>
          {canDelete && (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              <span className="sr-only">Delete slide</span>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      {/* Two-column layout: Image left, Fields right */}
      <div className="grid grid-cols-5 gap-4">
        {/* Left: Image (2 columns) */}
        <div className="col-span-2">
          <Label className="mb-2 block">
            Image *{" "}
            {errors[`${index}-image`] && (
              <span className="text-destructive text-xs ml-1">
                ({errors[`${index}-image`]})
              </span>
            )}
          </Label>
          <PendingImageUpload
            onImageSelect={onImageSelect}
            currentImageUrl={unit.url}
            currentFile={unit.pendingFile}
            onRemove={onRemoveImage}
            aspectRatio="4/3"
            maxSizeMB={5}
          />
        </div>

        {/* Right: Fields (3 columns) */}
        <div className="col-span-3 space-y-4">
          {/* Alt Text */}
          <div>
            <Label htmlFor={`alt-${index}`}>
              Alt Text *{" "}
              {errors[`${index}-alt`] && (
                <span className="text-destructive text-xs ml-1">
                  ({errors[`${index}-alt`]})
                </span>
              )}
            </Label>
            <Input
              id={`alt-${index}`}
              value={unit.alt}
              onChange={(e) => onFieldChange("alt", e.target.value)}
              placeholder="Descriptive text for accessibility"
              maxLength={200}
              className={errors[`${index}-alt`] ? "border-destructive" : ""}
            />
          </div>

          {/* Location Preview Fields */}
          {type === "locationPreview" && (
            <>
              <div>
                <Label htmlFor={`title-${index}`}>
                  Title *{" "}
                  {errors[`${index}-title`] && (
                    <span className="text-destructive text-xs ml-1">
                      ({errors[`${index}-title`]})
                    </span>
                  )}
                </Label>
                <Input
                  id={`title-${index}`}
                  value={unit.title || ""}
                  onChange={(e) => onFieldChange("title", e.target.value)}
                  placeholder="e.g., Downtown Roastery"
                  maxLength={100}
                  className={
                    errors[`${index}-title`] ? "border-destructive" : ""
                  }
                />
              </div>

              <div>
                <Label htmlFor={`description-${index}`}>
                  Description *{" "}
                  {errors[`${index}-description`] && (
                    <span className="text-destructive text-xs ml-1">
                      ({errors[`${index}-description`]})
                    </span>
                  )}
                </Label>
                <Textarea
                  id={`description-${index}`}
                  value={unit.description || ""}
                  onChange={(e) => onFieldChange("description", e.target.value)}
                  placeholder="Brief description of the location"
                  maxLength={500}
                  rows={3}
                  className={
                    errors[`${index}-description`] ? "border-destructive" : ""
                  }
                />
              </div>

              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Location Block:</strong>{" "}
                  {isNewLocation
                    ? "A new location block will be created when you save this carousel."
                    : "This slide is linked to an existing location block. Edit location details in the location block itself."}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
