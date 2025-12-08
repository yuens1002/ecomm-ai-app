import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { blockSchema, Block } from "@/lib/blocks/schemas";
import { GeneratedBlock } from "@/lib/api-schemas/generate-about";
import { v4 as uuidv4 } from "uuid";

function normalizeBlock(
  incoming: GeneratedBlock,
  heroImageFallback?: string | null,
  heroAltFallback?: string | null
): Block | null {
  const order = incoming.order ?? 0;

  switch (incoming.type) {
    case "hero": {
      const content = incoming.content ?? {};
      const heading = content.heading ?? content.title ?? "Our Story";
      const imageUrl = content.imageUrl ?? heroImageFallback ?? "";
      if (!imageUrl) return null; // hero requires image
      const heroBlock: Block = {
        id: uuidv4(),
        type: "hero",
        order,
        isDeleted: false,
        layoutColumn: "full",
        content: {
          heading,
          imageUrl,
          imageAlt:
            content.imageAlt || content.altText || heroAltFallback || undefined,
          caption: content.caption || undefined,
        },
      };
      const result = blockSchema.safeParse(heroBlock);
      return result.success ? result.data : null;
    }
    case "stat": {
      const content = incoming.content ?? {};
      const statBlock: Block = {
        id: uuidv4(),
        type: "stat",
        order,
        isDeleted: false,
        layoutColumn: "full",
        content: {
          label: content.label || "",
          value: content.value || "",
          emoji: content.emoji || undefined,
        },
      };
      const result = blockSchema.safeParse(statBlock);
      return result.success ? result.data : null;
    }
    case "pullQuote": {
      const content = incoming.content ?? {};
      const block: Block = {
        id: uuidv4(),
        type: "pullQuote",
        order,
        isDeleted: false,
        layoutColumn: "full",
        content: {
          text: content.text || "",
          author: content.author || undefined,
        },
      };
      const result = blockSchema.safeParse(block);
      return result.success ? result.data : null;
    }
    case "richText": {
      const content = incoming.content ?? {};
      const block: Block = {
        id: uuidv4(),
        type: "richText",
        order,
        isDeleted: false,
        layoutColumn: "full",
        content: {
          html: content.html || "",
        },
      };
      const result = blockSchema.safeParse(block);
      return result.success ? result.data : null;
    }
    default:
      return null;
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      blocks = [],
      metaDescription,
      heroImageUrl: heroImageFallback,
      heroAltText,
    } = body as {
      blocks?: GeneratedBlock[];
      metaDescription?: string | null;
      heroImageUrl?: string | null;
      heroAltText?: string | null;
    };

    const normalized: Block[] = [];
    for (const incoming of blocks) {
      const block = normalizeBlock(incoming, heroImageFallback, heroAltText);
      if (block) {
        normalized.push(block);
      }
    }

    if (!normalized.length) {
      return NextResponse.json(
        { error: "No valid blocks to apply" },
        { status: 400 }
      );
    }

    // Replace blocks transactionally
    await prisma.$transaction([
      prisma.block.deleteMany({ where: { pageId: params.id } }),
      prisma.block.createMany({
        data: normalized.map((b) => ({
          id: b.id,
          pageId: params.id,
          type: b.type,
          order: b.order,
          content: b.content,
          isDeleted: b.isDeleted ?? false,
          layoutColumn: b.layoutColumn ?? "full",
          originalContent: b.originalContent,
        })),
      }),
      prisma.page.update({
        where: { id: params.id },
        data: {
          content: JSON.stringify(normalized),
          ...(metaDescription !== undefined ? { metaDescription } : {}),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      blocksApplied: normalized.length,
      blocks: normalized,
      metaDescription: metaDescription ?? null,
    });
  } catch (error) {
    console.error("Error replacing blocks:", error);
    return NextResponse.json(
      { error: "Failed to replace blocks" },
      { status: 500 }
    );
  }
}
