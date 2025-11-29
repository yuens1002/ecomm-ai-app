import { LayoutRenderer } from "./types";
import { renderBlock } from "./render-block";
import { Block, BlockType } from "@/lib/blocks/schemas";

/**
 * Accordion Layout Configuration
 */
export const accordionConfig = {
  allowedBlocks: ["hero", "faqItem", "richText"] as BlockType[],
  maxBlocks: {
    hero: 1,
    faqItem: 50,
    richText: 5,
  },
  requiredBlocks: ["hero"] as BlockType[],
};

/**
 * Slot Mapping: Defines which block types go into which template slots
 */
const slotMapping = {
  hero: (blocks: Block[]) => blocks.find((b) => b.type === "hero"),
  intro: (blocks: Block[]) =>
    blocks
      .filter((b) => b.type === "richText")
      .sort((a, b) => a.order - b.order),
  faqItems: (blocks: Block[]) =>
    blocks
      .filter((b) => b.type === "faqItem")
      .sort((a, b) => a.order - b.order),
};

/**
 * Accordion Layout Template
 *
 * Fixed Layout Structure:
 * 1. Hero at top
 * 2. Intro text (rich text blocks)
 * 3. FAQ items in accordion
 *
 * Used by: PageType.FAQ
 */
export const renderAccordionLayout: LayoutRenderer = (blocks, handlers) => {
  // Map blocks to template slots
  const hero = slotMapping.hero(blocks);
  const intro = slotMapping.intro(blocks);
  const faqItems = slotMapping.faqItems(blocks);

  return (
    <div className="space-y-8">
      {/* Slot: Hero */}
      {hero && renderBlock(hero, handlers)}

      {/* Slot: Intro Text */}
      {intro.length > 0 && (
        <div className="space-y-4 max-w-3xl">
          {intro.map((block) => renderBlock(block, handlers))}
        </div>
      )}

      {/* Slot: FAQ Items */}
      {faqItems.length > 0 && (
        <div className="space-y-2 max-w-3xl">
          {faqItems.map((block) => renderBlock(block, handlers))}
        </div>
      )}
    </div>
  );
};
