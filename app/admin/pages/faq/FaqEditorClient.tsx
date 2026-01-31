"use client";

import { PageEditor } from "@/app/admin/_components/cms/editors/PageEditor";
import { Block } from "@/lib/blocks/schemas";
import { renderAccordionLayout } from "@/lib/page-layouts";
import { PageType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface FaqEditorClientProps {
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
}

export default function FaqEditorClient({
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
}: FaqEditorClientProps) {
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
          ? "The FAQ page is now hidden from customers"
          : "The FAQ page is now visible to customers",
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
      pageType={PageType.FAQ}
      pageSlug={pageSlug}
      pageTitle={pageTitle}
      initialBlocks={initialBlocks}
      layoutRenderer={renderAccordionLayout}
      isPublished={isPublished}
      metaDescription={metaDescription}
      showInHeader={showInHeader}
      showInFooter={showInFooter}
      headerOrder={headerOrder}
      footerOrder={footerOrder}
      icon={icon}
      onPublishToggle={handlePublishToggle}
      onMetadataUpdate={handleMetadataUpdate}
    />
  );
}
