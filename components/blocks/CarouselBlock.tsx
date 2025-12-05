"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import {
  ImageCarouselBlock,
  LocationCarouselBlock,
} from "@/lib/blocks/schemas";
import { Button } from "@/components/ui/button";
import { BlockDialog } from "./BlockDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Switch } from "@/components/ui/switch";
import { Plus, ArrowRight } from "lucide-react";
import Image from "next/image";
import { ImageField } from "@/components/app-components/ImageField";
import { ImageCard } from "@/components/app-components/ImageCard";
import { CarouselDots } from "@/components/app-components/CarouselDots";
import { useMultiImageUpload } from "@/hooks/useImageUpload";
import { useValidation } from "@/hooks/useFormDialog";

type CarouselBlockType = ImageCarouselBlock | LocationCarouselBlock;

interface CarouselBlockProps {
  block: CarouselBlockType;
  isEditing: boolean;
  onUpdate?: (block: CarouselBlockType) => void;
  /** Page slug for organizing uploaded images */
  pageSlug?: string;
  // Dialog control from BlockRenderer
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
}

export function CarouselBlock({
  block,
  isEditing,
  onUpdate,
  pageSlug,
  isDialogOpen = false,
  onDialogOpenChange,
}: CarouselBlockProps) {
  // For backward compatibility, use internal state if not controlled
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = onDialogOpenChange ? isDialogOpen : internalDialogOpen;
  const setDialogOpen = onDialogOpenChange || setInternalDialogOpen;

  // Display mode (non-editing page view) or editing display
  // BlockRenderer handles the wrapper and deleted state
  if (!isEditing) {
    return <CarouselDisplay block={block} />;
  }

  // Empty state in edit mode - just show prompt (wrapper handled by BlockRenderer)
  if (block.content.slides.length === 0) {
    return (
      <>
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No slides in carousel</p>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Slides
          </Button>
        </div>
        <EditCarouselDialog
          block={block}
          onUpdate={onUpdate}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          pageSlug={pageSlug}
        />
      </>
    );
  }

  // Edit mode with content - just display + dialog (wrapper handled by BlockRenderer)
  return (
    <>
      <CarouselDisplay block={block} />
      <EditCarouselDialog
        block={block}
        onUpdate={onUpdate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pageSlug={pageSlug}
      />
    </>
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

  const handleSlideClick = (slide: {
    locationBlockId?: string;
    url?: string;
  }) => {
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
        {slides.map(
          (
            slide: {
              url: string;
              alt: string;
              title?: string;
              description?: string;
              locationBlockId?: string;
            },
            index: number
          ) => (
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
          )
        )}
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageSlug?: string;
}

// Metadata for location carousel slides (separate from image data managed by hook)
type SlideMetadata = {
  title: string;
  description: string;
  locationBlockId: string;
};

function EditCarouselDialog({
  block,
  onUpdate,
  open,
  onOpenChange,
  pageSlug,
}: EditCarouselDialogProps) {
  const isLocationCarousel = block.type === "locationCarousel";

  // Extract images from slides for the hook
  const currentImages = block.content.slides.map(
    (slide: { url: string; alt: string }) => ({
      url: slide.url,
      alt: slide.alt,
    })
  );

  // Use shared multi-image upload hook for image handling
  const {
    images,
    addImage: _addImage,
    addImageAfter,
    removeImage,
    moveUp,
    moveDown,
    handleFileSelect,
    updateAlt,
    uploadAll,
    reset: resetImages,
    canAdd,
  } = useMultiImageUpload({
    currentImages,
    minImages: 1,
    maxImages: 20,
    pageSlug,
  });

  // Separate state for location carousel metadata (title, description, locationBlockId)
  const [slideMetadata, setSlideMetadata] = useState<SlideMetadata[]>([]);
  const [autoScroll, setAutoScroll] = useState(
    block.content.autoScroll ?? true
  );
  const [intervalSeconds, setIntervalSeconds] = useState(
    block.content.intervalSeconds ?? 5
  );
  const [isSaving, setIsSaving] = useState(false);

  // Use validation hook for error state and toast
  const { errors, hasErrors, clearError, clearAllErrors, showValidationError } =
    useValidation<Record<string, string>>();

  // Track newly added slide for highlight animation
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Initialize metadata when dialog opens
  useEffect(() => {
    if (open && isLocationCarousel) {
      const slides = block.content.slides as Array<{
        title?: string;
        description?: string;
        locationBlockId?: string;
      }>;
      if (slides.length > 0) {
        setSlideMetadata(
          slides.map((slide) => ({
            title: slide.title || "",
            description: slide.description || "",
            locationBlockId:
              slide.locationBlockId || `temp-${Date.now()}-${Math.random()}`,
          }))
        );
      } else {
        setSlideMetadata([
          {
            title: "",
            description: "",
            locationBlockId: `temp-${Date.now()}-${Math.random()}`,
          },
        ]);
      }
    }
    if (open) {
      setAutoScroll(block.content.autoScroll ?? true);
      setIntervalSeconds(block.content.intervalSeconds ?? 5);
      clearAllErrors();
    }
  }, [open, block, isLocationCarousel]);

  const handleAddSlideAfter = (index: number) => {
    const newIndex = index + 1;
    addImageAfter(index);
    if (isLocationCarousel) {
      setSlideMetadata((prev) => {
        const updated = [...prev];
        updated.splice(index + 1, 0, {
          title: "",
          description: "",
          locationBlockId: `temp-${Date.now()}-${Math.random()}`,
        });
        return updated;
      });
    }
    // Highlight and scroll to new slide
    setHighlightedIndex(newIndex);
    setTimeout(() => {
      slideRefs.current
        .get(newIndex)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    setTimeout(() => setHighlightedIndex(null), 1500);
  };

  const handleRemoveSlide = (index: number) => {
    removeImage(index);
    if (isLocationCarousel) {
      setSlideMetadata((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleMoveSlideUp = (index: number) => {
    moveUp(index);
    if (isLocationCarousel && index > 0) {
      setSlideMetadata((prev) => {
        const updated = [...prev];
        [updated[index - 1], updated[index]] = [
          updated[index],
          updated[index - 1],
        ];
        return updated;
      });
    }
  };

  const handleMoveSlideDown = (index: number) => {
    moveDown(index);
    if (isLocationCarousel && index < slideMetadata.length - 1) {
      setSlideMetadata((prev) => {
        const updated = [...prev];
        [updated[index], updated[index + 1]] = [
          updated[index + 1],
          updated[index],
        ];
        return updated;
      });
    }
  };

  const updateMetadata = (
    index: number,
    field: keyof SlideMetadata,
    value: string
  ) => {
    setSlideMetadata((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateSlides = (): boolean => {
    const newErrors: Record<string, string> = {};

    images.forEach((image, index) => {
      // Check image
      if (!image.url && !image.pendingFile) {
        newErrors[`${index}-image`] = "Image is required";
      }

      // Check alt text
      if (!image.alt.trim()) {
        newErrors[`${index}-alt`] = "Alt text is required";
      }

      // Check location preview fields
      if (isLocationCarousel) {
        const meta = slideMetadata[index];
        if (!meta?.title?.trim()) {
          newErrors[`${index}-title`] = "Title is required";
        }
        if (!meta?.description?.trim()) {
          newErrors[`${index}-description`] = "Description is required";
        }
      }
    });

    // Show toast and set errors if validation fails
    return showValidationError(newErrors);
  };

  const handleSave = async () => {
    if (!onUpdate) return;

    if (!validateSlides()) return;

    setIsSaving(true);

    try {
      // Upload all pending images (hook handles old image cleanup)
      const uploadedImages = await uploadAll();

      // Build slides array with images + metadata
      const slides = uploadedImages.map((img, index) => {
        if (isLocationCarousel) {
          const meta = slideMetadata[index];
          return {
            url: img.url,
            alt: img.alt,
            title: meta?.title || "",
            description: meta?.description || "",
            locationBlockId: meta?.locationBlockId || "",
          };
        }
        return {
          url: img.url,
          alt: img.alt,
        };
      });

      const updatedBlock = {
        ...block,
        content: {
          includeHero: false,
          slides: isLocationCarousel
            ? (slides as Array<{
                url: string;
                alt: string;
                title: string;
                description: string;
                locationBlockId: string;
              }>)
            : (slides as Array<{ url: string; alt: string }>),
          autoScroll,
          intervalSeconds,
        },
      };

      onUpdate(updatedBlock as typeof block);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save carousel:", error);
      alert("Failed to save carousel. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    resetImages();
    clearAllErrors();
    if (isLocationCarousel) {
      // Reset metadata to original
      const slides = block.content.slides as Array<{
        title?: string;
        description?: string;
        locationBlockId?: string;
      }>;
      setSlideMetadata(
        slides.map((slide) => ({
          title: slide.title || "",
          description: slide.description || "",
          locationBlockId: slide.locationBlockId || "",
        }))
      );
    }
    onOpenChange(false);
  };

  return (
    <BlockDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Carousel"
      description={
        isLocationCarousel
          ? "Location carousel - add slides and configure settings"
          : "Image carousel - add slides and configure settings"
      }
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || hasErrors}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Carousel Settings - shown first */}
        <div className="space-y-4 border-b pb-6">
          <h3 className="font-semibold">Carousel Settings</h3>

          <div className="flex items-center justify-between">
            <FormHeading htmlFor="autoScroll" label="Auto-scroll" />
            <Switch
              id="autoScroll"
              checked={autoScroll}
              onCheckedChange={setAutoScroll}
            />
          </div>

          {autoScroll && (
            <div className="flex items-center justify-between">
              <FormHeading
                htmlFor="intervalSeconds"
                label="Interval (seconds)"
              />
              <Input
                id="intervalSeconds"
                type="number"
                min={2}
                max={10}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="w-16 h-8"
              />
            </div>
          )}
        </div>

        {/* Slides */}
        <div className="space-y-4">
          <h3 className="font-semibold">Slides ({images.length})</h3>

          {/* Slide Cards */}
          <div className="space-y-4">
            {images.map((image, index) => (
              <SlideCard
                key={index}
                ref={(el) => {
                  if (el) slideRefs.current.set(index, el);
                  else slideRefs.current.delete(index);
                }}
                image={image}
                metadata={isLocationCarousel ? slideMetadata[index] : undefined}
                index={index}
                total={images.length}
                isLocationCarousel={isLocationCarousel}
                canDelete={images.length > 1}
                canAdd={canAdd}
                isHighlighted={highlightedIndex === index}
                errors={errors}
                onFileSelect={(file) => {
                  try {
                    handleFileSelect(index, file);
                    clearError(`${index}-image`);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Invalid file");
                  }
                }}
                onAltChange={(alt) => {
                  updateAlt(index, alt);
                  clearError(`${index}-alt`);
                }}
                onMetadataChange={(field, value) => {
                  updateMetadata(index, field, value);
                  clearError(`${index}-${field}`);
                }}
                onMoveUp={() => handleMoveSlideUp(index)}
                onMoveDown={() => handleMoveSlideDown(index)}
                onRemove={() => handleRemoveSlide(index)}
                onAdd={() => handleAddSlideAfter(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </BlockDialog>
  );
}

interface SlideCardProps {
  image: {
    url: string;
    alt: string;
    pendingFile?: File;
    previewUrl?: string;
  };
  metadata?: {
    title: string;
    description: string;
    locationBlockId: string;
  };
  index: number;
  total: number;
  isLocationCarousel: boolean;
  canDelete: boolean;
  canAdd: boolean;
  isHighlighted?: boolean;
  errors: Record<string, string>;
  onFileSelect: (file: File) => void;
  onAltChange: (alt: string) => void;
  onMetadataChange: (
    field: "title" | "description" | "locationBlockId",
    value: string
  ) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onAdd: () => void;
}

const SlideCard = forwardRef<HTMLDivElement, SlideCardProps>(function SlideCard(
  {
    image,
    metadata,
    index,
    total,
    isLocationCarousel,
    canDelete,
    canAdd,
    isHighlighted,
    errors,
    onFileSelect,
    onAltChange,
    onMetadataChange,
    onMoveUp,
    onMoveDown,
    onRemove,
    onAdd,
  },
  ref
) {
  const isNewLocation = metadata?.locationBlockId?.startsWith("temp-");

  return (
    <ImageCard
      ref={ref}
      index={index}
      total={total}
      label="Slide"
      labelSuffix={
        isLocationCarousel && (
          <span className="ml-2 text-xs text-primary">
            {isNewLocation
              ? "(New Location Block)"
              : "(Linked to Location Block)"}
          </span>
        )
      }
      isHighlighted={isHighlighted}
      canAdd={canAdd}
      canDelete={canDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onAdd={onAdd}
      onRemove={onRemove}
    >
      <div className="space-y-4">
        <ImageField
          id={`slide-image-${index}`}
          label="Image"
          required
          value={image.url}
          pendingFile={image.pendingFile}
          previewUrl={image.previewUrl}
          onFileSelect={onFileSelect}
          error={errors[`${index}-image`]}
          showAltText
          altText={image.alt}
          onAltTextChange={onAltChange}
          altTextError={errors[`${index}-alt`]}
          altTextMaxLength={200}
        />

        {/* Location Preview Fields */}
        {isLocationCarousel && metadata && (
          <>
            <div>
              <FormHeading
                htmlFor={`title-${index}`}
                label="Title"
                required
                validationType={errors[`${index}-title`] ? "error" : undefined}
                errorMessage={errors[`${index}-title`]}
              />
              <Input
                id={`title-${index}`}
                value={metadata.title}
                onChange={(e) => onMetadataChange("title", e.target.value)}
                placeholder="e.g., Downtown Roastery"
                maxLength={100}
                className={errors[`${index}-title`] ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {metadata.title.length}/100 characters
              </p>
            </div>

            <div>
              <FormHeading
                htmlFor={`description-${index}`}
                label="Description"
                required
                validationType={
                  errors[`${index}-description`] ? "error" : undefined
                }
                errorMessage={errors[`${index}-description`]}
              />
              <Textarea
                id={`description-${index}`}
                value={metadata.description}
                onChange={(e) =>
                  onMetadataChange("description", e.target.value)
                }
                placeholder="Brief description of the location"
                maxLength={500}
                rows={3}
                className={
                  errors[`${index}-description`] ? "border-destructive" : ""
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                {metadata.description.length}/500 characters
              </p>
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
    </ImageCard>
  );
});
