"use client";

import { Block } from "@/lib/blocks/schemas";
import { PageType } from "@prisma/client";
import { getLayoutRenderer } from "@/lib/page-layouts";

interface PageContentProps {
  blocks: Block[];
  pageType: PageType;
  pageTitle: string;
}

export function PageContent({ blocks, pageType, pageTitle }: PageContentProps) {
  const layoutRenderer = getLayoutRenderer(pageType);

  if (blocks.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{pageTitle}</h1>
        <p className="text-xl text-muted-foreground">Content coming soon.</p>
      </div>
    );
  }

  return <>{layoutRenderer(blocks)}</>;
}
