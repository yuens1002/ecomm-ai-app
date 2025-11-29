import { LayoutRenderer } from "./types";
import { renderBlock } from "./render-block";
import { Block, BlockType } from "@/lib/blocks/schemas";

/**
 * Single Column Layout Configuration
 */
export const singleColumnConfig = {
  allowedBlocks: ["hero", "richText", "imageGallery"] as BlockType[],
  maxBlocks: {
    hero: 1,
    richText: 20,
    imageGallery: 5,
  },
  requiredBlocks: [] as BlockType[],
};

/**
 * Slot Mapping: All blocks render in order
 */
const slotMapping = {
  allBlocks: (blocks: Block[]) => blocks.sort((a, b) => a.order - b.order),
};

/**
 * Single Column Layout Template
 *
 * Simple vertical stack - all blocks render in order.
 * Used by: PageType.GENERIC
 */
export const renderSingleColumnLayout: LayoutRenderer = (blocks, handlers) => {
  const allBlocks = slotMapping.allBlocks(blocks);

  return (
    <div className="space-y-4">
      {allBlocks.map((block) => renderBlock(block, handlers))}
    </div>
  );
};
