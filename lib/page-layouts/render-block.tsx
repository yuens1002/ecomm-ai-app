import { Block } from "@/lib/blocks/schemas";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { BlockHandlers } from "./types";

/**
 * Helper function to render a single block
 * Used by all layout renderers to render blocks consistently
 * If handlers provided, renders in editing mode. Otherwise, public view.
 */
export function renderBlock(block: Block, handlers?: BlockHandlers) {
  if (handlers) {
    return (
      <BlockRenderer
        key={block.id}
        block={block}
        isEditing={true}
        isSelected={handlers.selectedBlockId === block.id}
        onSelect={() => handlers.onSelect(block.id)}
        onUpdate={handlers.onUpdate}
        onDelete={handlers.onDelete}
        onRestore={handlers.onRestore}
      />
    );
  }
  return <BlockRenderer key={block.id} block={block} isEditing={false} />;
}
