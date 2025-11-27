"use client";

import { PageEditor } from "@/components/PageEditor";
import { Block } from "@/lib/blocks/schemas";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface AboutEditorClientProps {
  pageId: string;
  initialBlocks: Block[];
  isPublished: boolean;
}

export default function AboutEditorClient({
  pageId,
  initialBlocks,
  isPublished: initialIsPublished,
}: AboutEditorClientProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initialIsPublished);
  const [isToggling, setIsToggling] = useState(false);

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

  return (
    <div className="container mx-auto py-8">
      <PageEditor
        pageId={pageId}
        pageType="about"
        initialBlocks={initialBlocks}
        isPublished={isPublished}
        onPublishToggle={handlePublishToggle}
      />
    </div>
  );
}
