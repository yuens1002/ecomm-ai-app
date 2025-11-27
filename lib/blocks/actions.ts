"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { blockSchema, Block, BlockType, createBlock } from "./schemas";

/**
 * Server Actions for Block Management
 *
 * All block CRUD operations with Zod validation
 */

/**
 * Add a new block to a page
 */
export async function addBlock(
  pageId: string,
  blockType: BlockType,
  order: number
) {
  try {
    const newBlock = createBlock(blockType, order);

    // Validate the block
    const result = blockSchema.safeParse(newBlock);
    if (!result.success) {
      return { error: "Invalid block data", details: result.error.format() };
    }

    // Store in database (assuming we'll add a Block model)
    // For now, we'll update the page's content field with blocks array
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { content: true },
    });

    if (!page) {
      return { error: "Page not found" };
    }

    // Parse existing blocks or start with empty array
    let blocks: Block[] = [];
    try {
      blocks = page.content ? JSON.parse(page.content) : [];
    } catch (e) {
      blocks = [];
    }

    // Add new block
    blocks.push(result.data as Block);

    // Update page
    await prisma.page.update({
      where: { id: pageId },
      data: { content: JSON.stringify(blocks) },
    });

    revalidatePath("/admin/pages");
    return { success: true, block: result.data };
  } catch (error) {
    console.error("Error adding block:", error);
    return { error: "Failed to add block" };
  }
}

/**
 * Update an existing block
 */
export async function updateBlock(pageId: string, blockData: unknown) {
  try {
    // Validate with Zod
    const result = blockSchema.safeParse(blockData);
    if (!result.success) {
      return { error: "Invalid block data", details: result.error.format() };
    }

    const block = result.data;

    // Get current blocks
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { content: true },
    });

    if (!page) {
      return { error: "Page not found" };
    }

    let blocks: Block[] = [];
    try {
      blocks = page.content ? JSON.parse(page.content) : [];
    } catch (e) {
      return { error: "Invalid page content" };
    }

    // Find and update the block
    const blockIndex = blocks.findIndex((b) => b.id === block.id);
    if (blockIndex === -1) {
      return { error: "Block not found" };
    }

    blocks[blockIndex] = block;

    // Update page
    await prisma.page.update({
      where: { id: pageId },
      data: { content: JSON.stringify(blocks) },
    });

    revalidatePath("/admin/pages");
    return { success: true, block };
  } catch (error) {
    console.error("Error updating block:", error);
    return { error: "Failed to update block" };
  }
}

/**
 * Delete a block
 */
export async function deleteBlock(pageId: string, blockId: string) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { content: true },
    });

    if (!page) {
      return { error: "Page not found" };
    }

    let blocks: Block[] = [];
    try {
      blocks = page.content ? JSON.parse(page.content) : [];
    } catch (e) {
      return { error: "Invalid page content" };
    }

    // Filter out the block
    blocks = blocks.filter((b) => b.id !== blockId);

    // Update page
    await prisma.page.update({
      where: { id: pageId },
      data: { content: JSON.stringify(blocks) },
    });

    revalidatePath("/admin/pages");
    return { success: true };
  } catch (error) {
    console.error("Error deleting block:", error);
    return { error: "Failed to delete block" };
  }
}

/**
 * Reorder blocks
 */
export async function reorderBlocks(pageId: string, blockIds: string[]) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { content: true },
    });

    if (!page) {
      return { error: "Page not found" };
    }

    let blocks: Block[] = [];
    try {
      blocks = page.content ? JSON.parse(page.content) : [];
    } catch (e) {
      return { error: "Invalid page content" };
    }

    // Create a map for quick lookup
    const blockMap = new Map(blocks.map((b) => [b.id, b]));

    // Reorder based on blockIds array
    const reorderedBlocks = blockIds
      .map((id, index) => {
        const block = blockMap.get(id);
        if (block) {
          return { ...block, order: index };
        }
        return null;
      })
      .filter((b): b is Block => b !== null);

    // Update page
    await prisma.page.update({
      where: { id: pageId },
      data: { content: JSON.stringify(reorderedBlocks) },
    });

    revalidatePath("/admin/pages");
    return { success: true };
  } catch (error) {
    console.error("Error reordering blocks:", error);
    return { error: "Failed to reorder blocks" };
  }
}

/**
 * Get all blocks for a page
 */
export async function getPageBlocks(pageId: string): Promise<Block[]> {
  try {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { content: true },
    });

    if (!page || !page.content) {
      return [];
    }

    // Try to parse as JSON, if it fails, it's old HTML content - return empty array
    let blocks;
    try {
      blocks = JSON.parse(page.content);
    } catch (parseError) {
      // Content is not JSON (probably old HTML), return empty blocks array
      console.log("Page content is not JSON, returning empty blocks array");
      return [];
    }

    // Validate all blocks
    const validatedBlocks: Block[] = [];
    for (const block of blocks) {
      const result = blockSchema.safeParse(block);
      if (result.success) {
        validatedBlocks.push(result.data);
      }
    }

    // Sort by order
    return validatedBlocks.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error getting page blocks:", error);
    return [];
  }
}
