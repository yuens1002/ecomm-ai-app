import { ReactNode } from "react";
import { Block, BlockType } from "@/lib/blocks/schemas";

/**
 * Block Handler Functions
 * Used to pass CRUD operations to layout renderers
 */
export interface BlockHandlers {
  onUpdate?: (block: Block) => void;
  onDelete?: (blockId: string) => void;
  onRestore?: (blockId: string) => void;
  onSelect: (blockId: string) => void;
  onAddBlock?: (blockType: BlockType, afterBlockId?: string) => void;
  selectedBlockId: string | null;
  /** Function to check if a block can be deleted (not at minimum count) */
  canDeleteBlock?: (block: Block) => boolean;
  /** Page slug for organizing uploaded images into /pages/[pageSlug]/ */
  pageSlug?: string;
}

/**
 * Layout Renderer Function Type
 * Takes blocks and optional handlers, returns rendered layout
 * If handlers provided, renders in editing mode. Otherwise, public view.
 */
export type LayoutRenderer = (
  blocks: Block[],
  handlers?: BlockHandlers
) => ReactNode;
