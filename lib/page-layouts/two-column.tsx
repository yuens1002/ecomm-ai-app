"use client";

import { LayoutRenderer } from "./types";
import { Block, BlockType, BLOCK_METADATA } from "@/lib/blocks/schemas";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/**
 * Two-Column Layout Configuration
 */
export const twoColumnConfig = {
  allowedBlocks: ["hero", "stat", "pullQuote", "richText"] as BlockType[],
  maxBlocks: {
    hero: 1,
    stat: 6,
    pullQuote: 1,
    richText: 1,
  },
  minBlocks: {
    stat: 3,
  },
  requiredBlocks: ["hero", "richText", "pullQuote"] as BlockType[],
};

/**
 * Slot Mapping: Defines which block types go into which template slots
 */
const slotMapping = {
  hero: (blocks: Block[]) => blocks.find((b) => b.type === "hero"),
  stats: (blocks: Block[]) =>
    blocks.filter((b) => b.type === "stat").sort((a, b) => a.order - b.order),
  leftSidebar: (blocks: Block[]) => blocks.find((b) => b.type === "pullQuote"),
  mainContent: (blocks: Block[]) =>
    blocks
      .filter((b) => b.type === "richText")
      .sort((a, b) => a.order - b.order),
};

/**
 * Wrapper component for blocks with hover "Add After" button
 */
function BlockWithAddButton({
  block,
  handlers,
  canAdd,
  canDelete,
  blockType,
  afterText,
}: {
  block: Block;
  handlers: any;
  canAdd: boolean;
  canDelete: boolean;
  blockType: BlockType;
  afterText: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const isNew = handlers.newBlockIds?.has(block.id) || false;

  return (
    <div
      className="relative h-full"
      onMouseEnter={() => setShowAdd(true)}
      onMouseLeave={() => setShowAdd(false)}
    >
      <BlockRenderer
        key={block.id}
        block={block}
        isEditing={true}
        isSelected={handlers.selectedBlockId === block.id}
        canDelete={canDelete}
        isNew={isNew}
        onSelect={() => handlers.onSelect(block.id)}
        onUpdate={handlers.onUpdate}
        onDelete={handlers.onDelete}
        onRestore={handlers.onRestore}
      />
      {canAdd && showAdd && (
        <div className="absolute top-2 left-2 z-20">
          <Button
            size="sm"
            variant="default"
            className="shadow-lg"
            onClick={() => handlers?.onAddBlock?.(blockType, block.id)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add {BLOCK_METADATA[blockType].name}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Two-Column Layout Template
 *
 * Pure JSX structure that defines the visual layout.
 * Slots are filled using the slotMapping above.
 */
export const renderTwoColumnLayout: LayoutRenderer = (blocks, handlers) => {
  // Map blocks to template slots
  const hero = slotMapping.hero(blocks);
  const stats = slotMapping.stats(blocks);
  const leftSidebar = slotMapping.leftSidebar(blocks);
  const mainContent = slotMapping.mainContent(blocks);

  const isEditing = !!handlers;
  const canAddHero = !hero && !!handlers?.onAddBlock;
  const canAddStat = stats.length < 6 && !!handlers?.onAddBlock;
  const canAddPullQuote = !leftSidebar && !!handlers?.onAddBlock;
  const canAddRichText = mainContent.length < 1 && !!handlers?.onAddBlock;

  // Calculate which blocks can be deleted
  const activeStatsCount = stats.filter((s) => !s.isDeleted).length;
  const canDeleteStat = activeStatsCount > 3; // Min is 3
  const canDeleteHero = false; // Hero is always required (max 1)
  const canDeleteRichText = false; // Rich text is now required (min 1, max 1)

  return (
    <div className="space-y-8">
      {/* Slot: Hero */}
      {hero ? (
        isEditing ? (
          <BlockRenderer
            key={hero.id}
            block={hero}
            isEditing={true}
            isSelected={handlers?.selectedBlockId === hero.id}
            canDelete={canDeleteHero}
            onSelect={() => handlers?.onSelect(hero.id)}
            onUpdate={handlers?.onUpdate}
            onDelete={handlers?.onDelete}
            onRestore={handlers?.onRestore}
          />
        ) : (
          <BlockRenderer key={hero.id} block={hero} isEditing={false} />
        )
      ) : (
        isEditing &&
        canAddHero && (
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
            <Button
              variant="outline"
              onClick={() => handlers?.onAddBlock?.("hero")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Hero Image
            </Button>
          </div>
        )
      )}

      {/* Slot: Stats Grid */}
      {(stats.length > 0 || (isEditing && canAddStat)) && (
        <>
          {/* Mobile: Carousel */}
          <div className="md:hidden">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent>
                {isEditing
                  ? stats.map((block) => (
                      <CarouselItem key={block.id}>
                        <BlockWithAddButton
                          block={block}
                          handlers={handlers}
                          canAdd={canAddStat}
                          canDelete={canDeleteStat}
                          blockType="stat"
                          afterText="Add Stat"
                        />
                      </CarouselItem>
                    ))
                  : stats.map((block) => (
                      <CarouselItem key={block.id}>
                        <BlockRenderer block={block} isEditing={false} />
                      </CarouselItem>
                    ))}
                {isEditing && stats.length === 0 && canAddStat && (
                  <CarouselItem>
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 flex items-center justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlers?.onAddBlock?.("stat")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Stat
                      </Button>
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
              {stats.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {isEditing
              ? stats.map((block) => (
                  <BlockWithAddButton
                    key={block.id}
                    block={block}
                    handlers={handlers}
                    canAdd={canAddStat}
                    canDelete={canDeleteStat}
                    blockType="stat"
                    afterText="Add Stat"
                  />
                ))
              : stats.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    isEditing={false}
                  />
                ))}
            {isEditing && stats.length === 0 && canAddStat && (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlers?.onAddBlock?.("stat")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stat
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Slot: Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Slot: Left Sidebar */}
        <div className="lg:col-span-1">
          {leftSidebar ? (
            isEditing ? (
              <BlockRenderer
                key={leftSidebar.id}
                block={leftSidebar}
                isEditing={true}
                isSelected={handlers?.selectedBlockId === leftSidebar.id}
                canDelete={true}
                onSelect={() => handlers?.onSelect(leftSidebar.id)}
                onUpdate={handlers?.onUpdate}
                onDelete={handlers?.onDelete}
                onRestore={handlers?.onRestore}
              />
            ) : (
              <BlockRenderer
                key={leftSidebar.id}
                block={leftSidebar}
                isEditing={false}
              />
            )
          ) : (
            isEditing &&
            canAddPullQuote && (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlers?.onAddBlock?.("pullQuote")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quote
                </Button>
              </div>
            )
          )}
        </div>

        {/* Slot: Main Content */}
        <div className="lg:col-span-2">
          {mainContent.length > 0 ? (
            isEditing ? (
              <BlockRenderer
                key={mainContent[0].id}
                block={mainContent[0]}
                isEditing={true}
                isSelected={handlers?.selectedBlockId === mainContent[0].id}
                canDelete={canDeleteRichText}
                onSelect={() => handlers?.onSelect(mainContent[0].id)}
                onUpdate={handlers?.onUpdate}
                onDelete={handlers?.onDelete}
                onRestore={handlers?.onRestore}
              />
            ) : (
              <BlockRenderer
                key={mainContent[0].id}
                block={mainContent[0]}
                isEditing={false}
              />
            )
          ) : (
            isEditing &&
            canAddRichText && (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <Button
                  variant="outline"
                  onClick={() => handlers?.onAddBlock?.("richText")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content Block
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
