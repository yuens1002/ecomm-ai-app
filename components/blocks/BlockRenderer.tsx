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

interface BlockRendererProps {
  block: Block;
  isEditing: boolean;
  onUpdate: (block: Block) => void;
  onDelete: (blockId: string) => void;
}

/**
 * Main block renderer component
 * Routes to appropriate block component based on type
 */
export function BlockRenderer({
  block,
  isEditing,
  onUpdate,
  onDelete,
}: BlockRendererProps) {
  const commonProps = { block, isEditing, onUpdate, onDelete };

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
    default:
      return null;
  }
}
