"use client";

import { useState } from "react";
import { Block, BlockType } from "@/lib/blocks/schemas";
import {
  PageType,
  PAGE_LAYOUTS,
  canAddBlock,
  getBlockDisplayName,
} from "@/lib/blocks/layouts";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { Button } from "@/components/ui/button";
import { Plus, Save, Eye, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  addBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
} from "@/lib/blocks/actions";

interface PageEditorProps {
  pageId: string;
  pageType: PageType;
  initialBlocks: Block[];
  isPublished?: boolean;
  onPublishToggle?: () => Promise<void>;
  onSave?: () => void;
}

export function PageEditor({
  pageId,
  pageType,
  initialBlocks,
  isPublished,
  onPublishToggle,
  onSave,
}: PageEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const layout = PAGE_LAYOUTS[pageType];

  const handleAddBlock = async (blockType: BlockType) => {
    const currentBlockCounts = blocks.reduce(
      (acc, block) => {
        acc[block.type] = (acc[block.type] || 0) + 1;
        return acc;
      },
      {} as Record<BlockType, number>
    );

    if (!canAddBlock(pageType, blockType, currentBlockCounts)) {
      toast({
        title: "Cannot add block",
        description: `Maximum ${getBlockDisplayName(blockType)} blocks reached for this page type.`,
        variant: "destructive",
      });
      return;
    }

    const result = await addBlock(pageId, blockType, blocks.length);

    if ("error" in result) {
      toast({
        title: "Error adding block",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    if (result.block) {
      setBlocks([...blocks, result.block]);
      toast({
        title: "Block added",
        description: `${getBlockDisplayName(blockType)} block added successfully.`,
      });
    }
  };

  const handleUpdateBlock = async (updatedBlock: Block) => {
    const result = await updateBlock(pageId, updatedBlock);

    if ("error" in result) {
      toast({
        title: "Error updating block",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setBlocks(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
    toast({
      title: "Block updated",
      description: "Block updated successfully.",
    });
  };

  const handleDeleteBlock = async (blockId: string) => {
    const result = await deleteBlock(pageId, blockId);

    if ("error" in result) {
      toast({
        title: "Error deleting block",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setBlocks(blocks.filter((b) => b.id !== blockId));
    toast({
      title: "Block deleted",
      description: "Block deleted successfully.",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Blocks are already saved individually via update/add/delete actions
      // This is just to trigger any parent component refresh
      toast({
        title: "Page saved",
        description: "Your changes have been saved.",
      });
      onSave?.();
    } finally {
      setIsSaving(false);
    }
  };

  const availableBlocks = layout.allowedBlocks.filter((blockType) => {
    const currentBlockCounts = blocks.reduce(
      (acc, block) => {
        acc[block.type] = (acc[block.type] || 0) + 1;
        return acc;
      },
      {} as Record<BlockType, number>
    );

    return canAddBlock(pageType, blockType, currentBlockCounts);
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Edit Mode
              </>
            )}
          </Button>

          {isEditing && availableBlocks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Block
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {availableBlocks.map((blockType) => (
                  <DropdownMenuItem
                    key={blockType}
                    onClick={() => handleAddBlock(blockType)}
                  >
                    {getBlockDisplayName(blockType)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onPublishToggle && (
            <Button
              onClick={onPublishToggle}
              variant={isPublished ? "outline" : "default"}
              size="sm"
            >
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Blocks Container */}
      <div className="px-4 pb-8">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-lg">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold">No blocks yet</h3>
              <p className="text-muted-foreground max-w-md">
                Start building your page by adding blocks. Each block represents
                a section of content.
              </p>
              {isEditing && availableBlocks.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="lg" className="mt-4">
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Block
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    {availableBlocks.map((blockType) => (
                      <DropdownMenuItem
                        key={blockType}
                        onClick={() => handleAddBlock(blockType)}
                      >
                        {getBlockDisplayName(blockType)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`space-y-6 ${layout.defaultLayout === "two-column" ? "md:grid md:grid-cols-2 md:gap-6 md:space-y-0" : ""}`}
          >
            {blocks.map((block) => (
              <div key={block.id}>
                <BlockRenderer
                  block={block}
                  isEditing={isEditing}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
