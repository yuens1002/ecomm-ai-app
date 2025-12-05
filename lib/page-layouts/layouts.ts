/**
 * Page Layout Configurations
 * Maps PageType to layout configuration (imported from each layout file)
 */

import { PageType } from "@prisma/client";
import { BlockType } from "@/lib/blocks/schemas";
import { singleColumnConfig } from "./single-column";
import { twoColumnConfig } from "./two-column";
import { locationInfoConfig } from "./location-info";
import { accordionConfig } from "./accordion";

export interface PageLayoutConfig {
  allowedBlocks: BlockType[];
  maxBlocks: Partial<Record<BlockType, number>>;
  minBlocks?: Partial<Record<BlockType, number>>;
  requiredBlocks: BlockType[];
}

/**
 * Map PageType enum to layout configuration
 * Each layout file exports its own config
 */
export const PAGE_LAYOUTS: Record<PageType, PageLayoutConfig> = {
  [PageType.GENERIC]: singleColumnConfig,
  [PageType.ABOUT]: twoColumnConfig,
  [PageType.CAFE]: locationInfoConfig,
  [PageType.FAQ]: accordionConfig,
  [PageType.LINK]: {
    allowedBlocks: [],
    maxBlocks: {},
    requiredBlocks: [],
  },
};

// Legacy string-based page types for backward compatibility
export type PageTypeString = "about" | "cafe" | "faq" | "generic";

export const PAGE_TYPES = {
  ABOUT: "about" as const,
  CAFE: "cafe" as const,
  FAQ: "faq" as const,
  GENERIC: "generic" as const,
};

/**
 * Check if a block type is allowed for a page type
 */
export function isBlockAllowed(
  pageType: PageType | PageTypeString,
  blockType: BlockType
): boolean {
  const config =
    typeof pageType === "string"
      ? PAGE_LAYOUTS[pageType.toUpperCase() as PageType]
      : PAGE_LAYOUTS[pageType];
  return config.allowedBlocks.includes(blockType);
}

/**
 * Check if adding another block would exceed the maximum
 */
export function canAddBlock(
  pageType: PageType | PageTypeString,
  blockType: BlockType,
  currentCount: number
): boolean {
  const config =
    typeof pageType === "string"
      ? PAGE_LAYOUTS[pageType.toUpperCase() as PageType]
      : PAGE_LAYOUTS[pageType];
  const maxBlocks = config.maxBlocks;
  if (!maxBlocks || !maxBlocks[blockType]) return true;
  return currentCount < maxBlocks[blockType];
}

/**
 * Get the display name for a block type
 */
export function getBlockDisplayName(blockType: BlockType): string {
  const names: Record<BlockType, string> = {
    hero: "Hero Image",
    stat: "Statistic",
    pullQuote: "Pull Quote",
    richText: "Rich Text",
    location: "Location",
    hours: "Business Hours",
    faqItem: "FAQ Item",
    imageGallery: "Image Gallery",
    imageCarousel: "Image Carousel",
    locationCarousel: "Location Carousel",
  };
  return names[blockType];
}

/**
 * Check if a block type is required (in requiredBlocks array)
 */
export function isBlockRequired(
  pageType: PageType | PageTypeString,
  blockType: BlockType
): boolean {
  const config =
    typeof pageType === "string"
      ? PAGE_LAYOUTS[pageType.toUpperCase() as PageType]
      : PAGE_LAYOUTS[pageType];
  return config.requiredBlocks.includes(blockType);
}

/**
 * Check if deleting a block would go below minimum count
 * Returns true if this is the last required block of its type or if at defined minimum
 */
export function isAtMinimumCount(
  pageType: PageType | PageTypeString,
  blockType: BlockType,
  currentCount: number
): boolean {
  const config =
    typeof pageType === "string"
      ? PAGE_LAYOUTS[pageType.toUpperCase() as PageType]
      : PAGE_LAYOUTS[pageType];

  // Check if there's a defined minimum for this block type
  const minCount = config.minBlocks?.[blockType];
  if (minCount !== undefined && currentCount <= minCount) {
    return true;
  }

  // If it's in requiredBlocks and we only have 1, it's at minimum
  if (config.requiredBlocks.includes(blockType) && currentCount <= 1) {
    return true;
  }

  return false;
}
