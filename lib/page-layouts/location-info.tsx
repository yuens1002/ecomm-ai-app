import { LayoutRenderer } from "./types";
import { renderBlock } from "./render-block";
import { Block, BlockType } from "@/lib/blocks/schemas";

/**
 * Location Info Layout Configuration
 */
export const locationInfoConfig = {
  allowedBlocks: [
    "hero",
    "location",
    "hours",
    "imageGallery",
    "richText",
  ] as BlockType[],
  maxBlocks: {
    hero: 1,
    location: 1,
    hours: 1,
    imageGallery: 3,
    richText: 10,
  },
  requiredBlocks: ["hero", "location", "hours"] as BlockType[],
};

/**
 * Slot Mapping: Defines which block types go into which template slots
 */
const slotMapping = {
  hero: (blocks: Block[]) => blocks.find((b) => b.type === "hero"),
  location: (blocks: Block[]) => blocks.find((b) => b.type === "location"),
  hours: (blocks: Block[]) => blocks.find((b) => b.type === "hours"),
  galleries: (blocks: Block[]) =>
    blocks
      .filter((b) => b.type === "imageGallery")
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
 * 1. Hero at top
 * 2. Location & Hours side-by-side
 * 3. Image galleries
 * 4. Rich text content
 *
 * Used by: PageType.CAFE
 */
export const renderLocationInfoLayout: LayoutRenderer = (blocks, handlers) => {
  // Map blocks to template slots
  const hero = slotMapping.hero(blocks);
  const location = slotMapping.location(blocks);
  const hours = slotMapping.hours(blocks);
  const galleries = slotMapping.galleries(blocks);
  const content = slotMapping.content(blocks);

  return (
    <div className="space-y-8">
      {/* Slot: Hero */}
      {hero && renderBlock(hero, handlers)}

      {/* Slot: Location & Hours Side-by-Side */}
      {(location || hours) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>{location && renderBlock(location, handlers)}</div>
          <div>{hours && renderBlock(hours, handlers)}</div>
        </div>
      )}

      {/* Slot: Image Galleries */}
      {galleries.length > 0 && (
        <div className="space-y-6">
          {galleries.map((block) => renderBlock(block, handlers))}
        </div>
      )}

      {/* Slot: Rich Text Content */}
      {content.length > 0 && (
        <div className="space-y-4">
          {content.map((block) => renderBlock(block, handlers))}
        </div>
      )}
    </div>
  );
};
