"use client";

import { Block } from "@/lib/blocks/schemas";
import { StatBlock } from "./StatBlock";
import { PullQuoteBlock } from "./PullQuoteBlock";
import { RichTextBlock } from "./RichTextBlock";
import { HeroBlock } from "./HeroBlock";
import { LocationBlock } from "./LocationBlock";
import { HoursBlock } from "./HoursBlock";
import { FaqItemBlock } from "./FaqItemBlock";
import { ImageGalleryBlock } from "./ImageGalleryBlock";
import { CarouselBlock } from "./CarouselBlock";

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
  const commonProps = {
    block,
    isEditing,
    isSelected,
    canDelete,
    isNew,
    onSelect,
    onUpdate,
    onDelete,
    onRestore,
  };

  switch (block.type) {
    case "hero":
      return <HeroBlock {...commonProps} block={block} />;
    case "stat":
      return <StatBlock {...commonProps} block={block} />;
    case "pullQuote":
      return <PullQuoteBlock {...commonProps} block={block} />;
    case "richText":
      return <RichTextBlock {...commonProps} block={block} />;
    case "location":
      return <LocationBlock {...commonProps} block={block} />;
    case "hours":
      return <HoursBlock {...commonProps} block={block} />;
    case "faqItem":
      return <FaqItemBlock {...commonProps} block={block} />;
    case "imageGallery":
      return <ImageGalleryBlock {...commonProps} block={block} />;
    case "imageCarousel":
      return <CarouselBlock {...commonProps} block={block} />;
    case "locationCarousel":
      return <CarouselBlock {...commonProps} block={block} />;
    default:
      return null;
  }
}
