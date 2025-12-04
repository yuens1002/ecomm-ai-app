import { LayoutRenderer } from "./types";
import { renderBlock } from "./render-block";
import {
  Block,
  BlockType,
  FaqItemBlock,
  BLOCK_METADATA,
} from "@/lib/blocks/schemas";
import { FaqPageContent } from "@/components/app-components/FaqPageContent";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

/**
 * Accordion Layout Configuration
 */
export const accordionConfig = {
  allowedBlocks: ["hero", "faqItem"] as BlockType[],
  maxBlocks: {
    hero: 1,
    faqItem: 50,
  },
  requiredBlocks: ["hero"] as BlockType[],
};

/**
 * Slot Mapping: Defines which block types go into which template slots
 */
const slotMapping = {
  hero: (blocks: Block[]) => blocks.find((b) => b.type === "hero"),
  faqItems: (blocks: Block[]) =>
    blocks
      .filter((b) => b.type === "faqItem")
      .sort((a, b) => a.order - b.order) as FaqItemBlock[],
};

/**
 * Accordion Layout Template
 *
 * Fixed Layout Structure:
 * 1. Hero at top
 * 2. FAQ items:
 *    - Public view: grouped by category with search/filter
 *    - Edit mode: individual editable blocks with add button
 *
 * Used by: PageType.FAQ
 */
export const renderAccordionLayout: LayoutRenderer = (blocks, handlers) => {
  // Map blocks to template slots
  const hero = slotMapping.hero(blocks);
  const faqItems = slotMapping.faqItems(blocks);

  const isEditing = !!handlers;
  const canAddFaqItem = faqItems.length < 50 && !!handlers?.onAddBlock;

  return (
    <div className="space-y-8 pb-16">
      {/* Slot: Hero */}
      {hero && renderBlock(hero, handlers)}

      {/* Slot: FAQ Items */}
      {isEditing ? (
        // Edit mode: render individual FAQ blocks with BlockRenderer
        <div className="space-y-4 max-w-3xl">
          {faqItems.length > 0 ? (
            <>
              {faqItems.map((block) => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  isEditing={true}
                  isSelected={handlers?.selectedBlockId === block.id}
                  canDelete={true}
                  isNew={handlers?.newBlockIds?.has(block.id) || false}
                  onSelect={() => handlers?.onSelect(block.id)}
                  onUpdate={handlers?.onUpdate}
                  onDelete={handlers?.onDelete}
                  onRestore={handlers?.onRestore}
                />
              ))}
              {/* Add FAQ Item button at bottom */}
              {canAddFaqItem && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handlers?.onAddBlock?.("faqItem")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {BLOCK_METADATA.faqItem.name}
                  </Button>
                </div>
              )}
            </>
          ) : (
            // Empty state - prompt to add first FAQ item
            canAddFaqItem && (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <p className="text-muted-foreground mb-4">No FAQ items yet</p>
                <Button
                  variant="outline"
                  onClick={() => handlers?.onAddBlock?.("faqItem")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {BLOCK_METADATA.faqItem.name}
                </Button>
              </div>
            )
          )}
        </div>
      ) : (
        // Public view: grouped by category with search
        faqItems.length > 0 && (
          <FaqPageContent faqItems={faqItems} className="max-w-3xl" />
        )
      )}
    </div>
  );
};
