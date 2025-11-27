/**
 * Page Layout Configurations
 * 
 * Defines which blocks are allowed for each page type
 * and their default layout structure.
 */

import { BlockType } from "./schemas";

export type PageType = "about" | "cafe" | "faq";

export interface PageLayoutConfig {
  allowedBlocks: BlockType[];
  defaultLayout: "two-column" | "single-column" | "accordion";
  maxBlocks?: Record<BlockType, number>; // Optional limits per block type
  requiredBlocks?: BlockType[]; // Blocks that must exist
}

export const PAGE_LAYOUTS: Record<PageType, PageLayoutConfig> = {
  about: {
    allowedBlocks: ["hero", "stat", "pullQuote", "richText"],
    defaultLayout: "two-column",
    maxBlocks: {
      hero: 1,
      stat: 3,
      pullQuote: 1,
      richText: 10,
    },
    requiredBlocks: ["hero"],
  },
  
  cafe: {
    allowedBlocks: ["hero", "location", "hours", "imageGallery", "richText"],
    defaultLayout: "single-column",
    maxBlocks: {
      hero: 1,
      location: 1,
      hours: 1,
      imageGallery: 3,
      richText: 10,
    },
    requiredBlocks: ["hero", "location", "hours"],
  },
  
  faq: {
    allowedBlocks: ["hero", "faqItem", "richText"],
    defaultLayout: "accordion",
    maxBlocks: {
      hero: 1,
      faqItem: 50,
      richText: 5,
    },
    requiredBlocks: ["hero"],
  },
};

/**
 * Check if a block type is allowed for a page type
 */
export function isBlockAllowed(pageType: PageType, blockType: BlockType): boolean {
  return PAGE_LAYOUTS[pageType].allowedBlocks.includes(blockType);
}

/**
 * Check if adding another block would exceed the maximum
 */
export function canAddBlock(
  pageType: PageType,
  blockType: BlockType,
  currentCount: number
): boolean {
  const maxBlocks = PAGE_LAYOUTS[pageType].maxBlocks;
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
  };
  return names[blockType];
}
