import { LayoutRenderer } from "./types";
import { renderBlock } from "./render-block";
import { Block, BlockType } from "@/lib/blocks/schemas";
import { LocationType } from "@/lib/location-type";

/**
 * Location Info Layout Configuration
 *
 * NOTE: This config allows BOTH carousel types because the location type
 * setting is determined at runtime via app settings. The actual allowed/required
 * blocks are filtered dynamically based on the location type.
 *
 * The page is shipped pre-populated with blocks - admin only edits what's there.
 * No "Add Block" dropdown needed - blocks are managed in-place (edit/delete only).
 */
export const locationInfoConfig = {
  allowedBlocks: [
    "imageCarousel",
    "locationCarousel",
    "location",
    "richText",
  ] as BlockType[],
  maxBlocks: {
    imageCarousel: 1, // Only 1 carousel
    locationCarousel: 1,
    richText: 1, // Only 1 richText block
    // location: unlimited (no max)
  },
  minBlocks: {
    imageCarousel: 1, // Required for SINGLE location
    locationCarousel: 1, // Required for MULTI location
    location: 1, // At least 1 location required
    richText: 1, // At least 1 richText required
  },
  requiredBlocks: [] as BlockType[], // Use getRequiredBlocks() for dynamic requirements
};

/**
 * Get dynamically filtered allowed blocks based on location type
 * Used by PageEditor to determine which blocks can exist on the page
 */
export function getFilteredAllowedBlocks(
  locationType: LocationType
): BlockType[] {
  const isSingle = locationType === LocationType.SINGLE;
  return locationInfoConfig.allowedBlocks.filter((blockType) => {
    // Filter out the carousel type that doesn't match the location type
    if (blockType === "imageCarousel" && !isSingle) return false;
    if (blockType === "locationCarousel" && isSingle) return false;
    return true;
  });
}

/**
 * Get required blocks based on location type
 * These blocks must exist on the page (at least 1 of each type)
 *
 * - SINGLE location: imageCarousel (1), location (unlimited), richText (unlimited)
 * - MULTI location: locationCarousel (1), location (unlimited), richText (unlimited)
 *
 * Admin can add as many locations and richText blocks as needed.
 */
export function getRequiredBlocks(locationType: LocationType): BlockType[] {
  const isSingle = locationType === LocationType.SINGLE;
  return [
    isSingle ? "imageCarousel" : "locationCarousel",
    "location",
    "richText",
  ] as BlockType[];
}

/**
 * Slot Mapping: Defines which block types go into which template slots
 */
const slotMapping = {
  carousel: (blocks: Block[]) =>
    blocks.find(
      (b) => b.type === "imageCarousel" || b.type === "locationCarousel"
    ),
  locations: (blocks: Block[]) =>
    blocks
      .filter((b) => b.type === "location")
      .sort((a, b) => a.order - b.order),
  content: (blocks: Block[]) =>
    blocks
      .filter((b) => b.type === "richText")
      .sort((a, b) => a.order - b.order),
};

/**
 * Location Info Layout Template
 *
 * Fixed Layout Structure:
 * 1. Carousel at top (auto-scrolling with dot navigation)
 * 2. Full-width location sections (60% photos / 40% info)
 * 3. Optional rich text content at bottom
 *
 * Used by: PageType.CAFE
 */
export const renderLocationInfoLayout: LayoutRenderer = (blocks, handlers) => {
  // Map blocks to template slots
  const carousel = slotMapping.carousel(blocks);
  const locations = slotMapping.locations(blocks);
  const content = slotMapping.content(blocks);

  return (
    <>
      {/* Slot: Carousel - Full Width */}
      {carousel && (
        <div className="w-full pt-4 pb-8">
          {renderBlock(carousel, handlers)}
        </div>
      )}
      {/* Slot: Rich Text Content - border hugs left edge, content stays contained */}
      {content.length > 0 && (
        <div className="border-l-[10px] border-foreground mt-12">
          <div className="container mx-auto px-8 max-w-5xl space-y-8 py-8">
            {content.map((block) => renderBlock(block, handlers))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-8 pt-12 max-w-5xl">
        {/* Slot: Location Sections (60/40 split) */}
        {locations.length > 0 && (
          <div className="space-y-20 pb-16">
            {locations.map((block) => renderBlock(block, handlers))}
          </div>
        )}
      </div>
    </>
  );
};
