"use client";

import { useState } from "react";
import { Block } from "@/lib/blocks/schemas";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { StatBlock } from "./StatBlock";
import { PullQuoteBlock } from "./PullQuoteBlock";
import { RichTextBlock } from "./RichTextBlock";
import { HeroBlock } from "./HeroBlock";
import { LocationBlock } from "./LocationBlock";
import { HoursBlock } from "./HoursBlock";
import { FaqItemBlock } from "./FaqItemBlock";
import { ImageGalleryBlock } from "./ImageGalleryBlock";
import { CarouselBlock } from "./CarouselBlock";
import { EditableBlockWrapper } from "./EditableBlockWrapper";
import { DeletedBlockOverlay } from "./DeletedBlockOverlay";

interface BlockRendererProps {
  block: Block;
  isEditing: boolean;
  isSelected?: boolean;
  canDelete?: boolean;
  isNew?: boolean;
  onSelect?: () => void;
  onUpdate?: (block: Block) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
}

/**
 * Main block renderer component
 * Routes to appropriate block component based on type
 * In editing mode, wraps blocks with EditableBlockWrapper for consistent edit controls
 */
export function BlockRenderer({
  block,
  isEditing,
  isSelected,
  canDelete = true,
  isNew = false,
  onSelect,
  onUpdate,
  onDelete,
  onRestore,
}: BlockRendererProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Props passed to individual block components (display + dialog only)
  const blockProps = {
    block,
    isEditing,
    isNew,
    onUpdate,
    // Dialog control - blocks will use these to manage their edit dialog
    isDialogOpen,
    onDialogOpenChange: setIsDialogOpen,
  };

  // Get the block display name for deleted overlay
  const getBlockName = (type: string) => {
    const names: Record<string, string> = {
      hero: "Hero",
      stat: "Stat",
      pullQuote: "Pull Quote",
      richText: "Rich Text",
      location: "Location",
      hours: "Hours",
      faqItem: "FAQ Item",
      imageGallery: "Image Gallery",
      imageCarousel: "Image Carousel",
      locationCarousel: "Location Carousel",
    };
    return names[type] || "Block";
  };

  // Render the appropriate block component
  const renderBlockContent = () => {
    switch (block.type) {
      case "hero":
        return <HeroBlock {...blockProps} block={block} />;
      case "stat":
        return <StatBlock {...blockProps} block={block} />;
      case "pullQuote":
        return <PullQuoteBlock {...blockProps} block={block} />;
      case "richText":
        return <RichTextBlock {...blockProps} block={block} />;
      case "location":
        return <LocationBlock {...blockProps} block={block} />;
      case "hours":
        return <HoursBlock {...blockProps} block={block} />;
      case "faqItem":
        return <FaqItemBlock {...blockProps} block={block} />;
      case "imageGallery":
        return <ImageGalleryBlock {...blockProps} block={block} />;
      case "imageCarousel":
        return <CarouselBlock {...blockProps} block={block} />;
      case "locationCarousel":
        return <CarouselBlock {...blockProps} block={block} />;
      default:
        return null;
    }
  };

  // Non-editing mode - just render the block
  if (!isEditing) {
    return renderBlockContent();
  }

  // Deleted state - show overlay with restore option
  if (block.isDeleted) {
    return (
      <DeletedBlockOverlay
        blockId={block.id}
        blockName={getBlockName(block.type)}
        onRestore={onRestore}
      >
        {renderBlockContent()}
      </DeletedBlockOverlay>
    );
  }

  // Editing mode - wrap with EditableBlockWrapper
  return (
    <EditableBlockWrapper
      onEdit={() => {
        onSelect?.();
        setIsDialogOpen(true);
      }}
      rightButtons={
        <>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setIsDialogOpen(true);
            }}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {canDelete && onDelete && (
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
        </>
      }
    >
      {renderBlockContent()}
    </EditableBlockWrapper>
  );
}
