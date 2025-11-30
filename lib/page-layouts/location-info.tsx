import { LayoutRenderer } from "./types";
import { renderBlock } from "./render-block";
import { Block, BlockType } from "@/lib/blocks/schemas";

/**
 * Location Info Layout Configuration
 */
export const locationInfoConfig = {
  allowedBlocks: [
    "imageCarousel",
    "locationCarousel",
    "location",
    "richText",
  ] as BlockType[],
  maxBlocks: {
    imageCarousel: 1,
    locationCarousel: 1,
    location: 5,
    richText: 10,
  },
  requiredBlocks: [] as BlockType[], // No required blocks - will be determined by app setting
};

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
    <div className="space-y-8">
      {/* Slot: Carousel */}
      {carousel && renderBlock(carousel, handlers)}

      {/* Slot: Location Sections (60/40 split) */}
      {locations.length > 0 && (
        <div className="space-y-8">
          {locations.map((block) => renderBlock(block, handlers))}
        </div>
      )}

      {/* Slot: Rich Text Content */}
      {content.length > 0 && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {content.map((block) => renderBlock(block, handlers))}
        </div>
      )}
    </div>
  );
};
