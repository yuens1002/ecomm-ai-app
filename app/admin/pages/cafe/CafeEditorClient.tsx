"use client";

import { PageEditor } from "@/components/app-components/PageEditor";
import { Block } from "@/lib/blocks/schemas";
import { renderLocationInfoLayout } from "@/lib/page-layouts";
import { PageType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { LocationType } from "@/lib/app-settings";

interface CafeEditorClientProps {
  pageId: string;
  pageSlug: string;
  pageTitle: string;
  initialBlocks: Block[];
  isPublished: boolean;
  metaDescription: string | null;
  showInHeader: boolean;
  showInFooter: boolean;
  headerOrder: number | null;
  footerOrder: number | null;
  icon: string | null;
  locationType: LocationType;
}

export default function CafeEditorClient({
  pageId,
  pageSlug,
  pageTitle,
  initialBlocks,
  isPublished: initialIsPublished,
  metaDescription,
  showInHeader,
  showInFooter,
  headerOrder,
  footerOrder,
  icon,
  locationType,
}: CafeEditorClientProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [_isToggling, setIsToggling] = useState(false);

  const handlePublishToggle = async () => {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (!response.ok) {
        throw new Error("Failed to update publish status");
      }

      setIsPublished(!isPublished);
      toast({
        title: isPublished ? "Page unpublished" : "Page published",
        description: isPublished
          ? "The Cafe page is now hidden from customers"
          : "The Cafe page is now visible to customers",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update publish status",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleMetadataUpdate = async (data: {
    title: string;
    metaDescription: string;
    showInHeader?: boolean;
    showInFooter?: boolean;
    headerOrder?: number | null;
    footerOrder?: number | null;
    icon?: string | null;
    isPublished?: boolean;
  }) => {
    const response = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update metadata");
    }

    router.refresh();
  };

  return (
    <PageEditor
      pageId={pageId}
      pageType={PageType.CAFE}
      pageSlug={pageSlug}
      pageTitle={pageTitle}
      initialBlocks={initialBlocks}
      layoutRenderer={renderLocationInfoLayout}
      isPublished={isPublished}
      metaDescription={metaDescription}
      showInHeader={showInHeader}
      showInFooter={showInFooter}
      headerOrder={headerOrder}
      footerOrder={footerOrder}
      icon={icon}
      locationType={locationType}
      onPublishToggle={handlePublishToggle}
      onMetadataUpdate={handleMetadataUpdate}
    />
  );
}
