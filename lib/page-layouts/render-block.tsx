import { Block } from "@/lib/blocks/schemas";
import { BlockRenderer } from "@/app/admin/_components/cms/blocks/BlockRenderer";
import { BlockHandlers } from "./types";

/**
 * Helper function to render a single block
 * Used by all layout renderers to render blocks consistently
 * If handlers provided, renders in editing mode. Otherwise, public view.
 */
export function renderBlock(block: Block, handlers?: BlockHandlers) {
  if (handlers) {
    // Check if this block can be deleted
    const canDelete = handlers.canDeleteBlock
      ? handlers.canDeleteBlock(block)
      : true;

    return (
      <BlockRenderer
        key={block.id}
        block={block}
        isEditing={true}
        isSelected={handlers.selectedBlockId === block.id}
        canDelete={canDelete}
        pageSlug={handlers.pageSlug}
        onSelect={() => handlers.onSelect(block.id)}
        onUpdate={handlers.onUpdate}
        onDelete={handlers.onDelete}
        onRestore={handlers.onRestore}
      />
    );
  }
  return <BlockRenderer key={block.id} block={block} isEditing={false} />;
}
