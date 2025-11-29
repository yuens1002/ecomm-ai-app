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

    const block = result.data;

    // Create block in Block table
    const createdBlock = await prisma.block.create({
      data: {
        id: block.id,
        pageId,
        type: block.type,
        order: block.order,
        content: block.content as any,
        isDeleted: block.isDeleted || false,
        originalContent: block.originalContent as any,
        layoutColumn: block.layoutColumn || "full",
      },
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
      console.error("Block validation failed:", result.error.format());
      return { error: "Invalid block data", details: result.error.format() };
    }

    const block = result.data;

    console.log("Updating block:", {
      blockId: block.id,
      pageId,
      type: block.type,
      hasContent: !!block.content,
    });

    // Verify block exists and belongs to this page
    const existingBlock = await prisma.block.findUnique({
      where: { id: block.id },
    });

    if (!existingBlock) {
      console.error("Block not found in database:", block.id);
      return { error: "Block not found" };
    }

    if (existingBlock.pageId !== pageId) {
      console.error("Block pageId mismatch:", {
        existingPageId: existingBlock.pageId,
        requestedPageId: pageId,
      });
      return { error: "Block does not belong to this page" };
    }

    // Update block in Block table
    const updatedBlock = await prisma.block.update({
      where: { id: block.id },
      data: {
        type: block.type,
        order: block.order,
        content: block.content as any,
        isDeleted: block.isDeleted,
        originalContent: block.originalContent as any,
        layoutColumn: block.layoutColumn,
      },
    });

    console.log("Block updated successfully:", updatedBlock.id);
    revalidatePath("/admin/pages");
    return { success: true, block };
  } catch (error) {
    console.error("Error updating block:", error);
    if ((error as any).code === "P2025") {
      return { error: "Block not found" };
    }
    return { error: "Failed to update block" };
  }
}

/**
 * Delete a block (hard delete - permanently removes from database)
 */
export async function deleteBlock(pageId: string, blockId: string) {
  try {
    // Verify block exists and belongs to this page
    const existingBlock = await prisma.block.findUnique({
      where: { id: blockId },
    });

    if (!existingBlock) {
      console.error("Block not found in database:", blockId);
      return { error: "Block not found" };
    }

    if (existingBlock.pageId !== pageId) {
      console.error("Block pageId mismatch:", {
        existingPageId: existingBlock.pageId,
        requestedPageId: pageId,
      });
      return { error: "Block does not belong to this page" };
    }

    // Permanently delete from database
    await prisma.block.delete({
      where: { id: blockId },
    });

    console.log("Block deleted successfully:", blockId);
    revalidatePath("/admin/pages");
    return { success: true };
  } catch (error) {
    console.error("Error deleting block:", error);
    if ((error as any).code === "P2025") {
      return { error: "Block not found" };
    }
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
    const dbBlocks = await prisma.block.findMany({
      where: { pageId },
      orderBy: { order: "asc" },
    });

    // Transform Prisma blocks to Block schema
    const validatedBlocks: Block[] = [];
    for (const dbBlock of dbBlocks) {
      const block = {
        id: dbBlock.id,
        type: dbBlock.type as BlockType,
        order: dbBlock.order,
        content: dbBlock.content,
        isDeleted: dbBlock.isDeleted,
        originalContent: dbBlock.originalContent,
      };

      const result = blockSchema.safeParse(block);
      if (result.success) {
        validatedBlocks.push(result.data);
      } else {
        console.error(`Invalid block ${dbBlock.id}:`, result.error);
      }
    }

    return validatedBlocks;
  } catch (error) {
    console.error("Error getting page blocks:", error);
    return [];
  }
}
