"use client";

import { PageEditor } from "@/components/app-components/PageEditor";
import { Block } from "@/lib/blocks/schemas";
import { renderTwoColumnLayout } from "@/lib/page-layouts";
import { WizardAnswers } from "@/lib/api-schemas/generate-about";
import { PageType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface AboutEditorClientProps {
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
  initialWizardAnswers?: WizardAnswers;
}

export default function AboutEditorClient({
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
  initialWizardAnswers,
}: AboutEditorClientProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [_isToggling, setIsToggling] = useState(false);

  const handlePublishToggle = async () => {
    setIsToggling(true);
    try {
      // pageId is loaded in page.tsx from the About page record
      const response = await fetch(`/api/admin/pages/${pageId}`, {
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
          ? "The About page is now hidden from customers"
          : "The About page is now visible to customers",
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
    // Same pageId from page.tsx About page lookup
    const response = await fetch(`/api/admin/pages/${pageId}`, {
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
      pageType={PageType.ABOUT}
      pageSlug={pageSlug}
      pageTitle={pageTitle}
      initialBlocks={initialBlocks}
      layoutRenderer={renderTwoColumnLayout}
      isPublished={isPublished}
      metaDescription={metaDescription}
      showInHeader={showInHeader}
      showInFooter={showInFooter}
      headerOrder={headerOrder}
      footerOrder={footerOrder}
      icon={icon}
      initialWizardAnswers={initialWizardAnswers}
      onPublishToggle={handlePublishToggle}
      onMetadataUpdate={handleMetadataUpdate}
    />
  );
}
