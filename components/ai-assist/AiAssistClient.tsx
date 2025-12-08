"use client";

import { useEffect, useMemo } from "react";
import { Block, HeroBlock, RichTextBlock } from "@/lib/blocks/schemas";
import { WizardAnswers } from "@/lib/api-schemas/generate-about";
import { AiAssistDialog } from "@/components/app-components/AiAssistDialog";
import { AiAssistContent } from "@/components/ai-assist/AiAssistContent";
import { useAiAssist } from "@/lib/ai-assist/useAiAssist";
import { buildAiFallbackAnswers } from "@/lib/ai-assist/fallbackAnswers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export type AiAssistClientProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  pageTitle: string;
  blocks: Block[];
  initialWizardAnswers?: WizardAnswers;
  onApplied: (result: {
    blocks?: Block[];
    metaDescription?: string | null;
  }) => void;
};

const isHeroBlock = (block: Block): block is HeroBlock => block.type === "hero";
const isRichTextBlock = (block: Block): block is RichTextBlock =>
  block.type === "richText";

export function AiAssistClient({
  open,
  onOpenChange,
  pageId,
  pageTitle,
  blocks,
  initialWizardAnswers,
  onApplied,
}: AiAssistClientProps) {
  const { toast } = useToast();
  const {
    answers: aiAnswers,
    setAnswers: setAiAnswers,
    selectedField: aiSelectedField,
    setSelectedField: setAiSelectedField,
    selectedStyle: aiSelectedStyle,
    setSelectedStyle: setAiSelectedStyle,
    isRegenerating,
    cachedVariations: aiCachedVariations,
    regenerate: regenerateAiContent,
  } = useAiAssist({
    pageId,
    initialAnswers: initialWizardAnswers,
    fallbackAnswers: () => buildAiFallbackAnswers(pageTitle),
    onApplied: (result) => {
      onApplied(result);
      onOpenChange(false);
    },
  });

  const stripHtml = (html?: string | null) => {
    if (!html) return "";
    return html
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const heroBlock = useMemo(
    () => blocks.find((b): b is HeroBlock => isHeroBlock(b) && !b.isDeleted),
    [blocks]
  );

  useEffect(() => {
    const hasUserEdits = Object.values(aiAnswers).some((v) => v);
    if (hasUserEdits) return;

    const richTextBlocks = blocks
      .filter((b): b is RichTextBlock => isRichTextBlock(b) && !b.isDeleted)
      .sort((a, b) => a.order - b.order);

    const firstText = stripHtml(richTextBlocks[0]?.content.html).slice(0, 600);
    const secondText = stripHtml(richTextBlocks[1]?.content.html).slice(0, 400);

    setAiAnswers((prev) => ({
      ...prev,
      businessName: prev.businessName || pageTitle || "",
      foundingStory: prev.foundingStory || firstText,
      uniqueApproach: prev.uniqueApproach || secondText,
      heroImageUrl: prev.heroImageUrl || heroBlock?.content.imageUrl || null,
      heroImageDescription:
        prev.heroImageDescription ||
        heroBlock?.content.imageAlt ||
        heroBlock?.content.caption ||
        null,
      previousHeroImageUrl:
        prev.previousHeroImageUrl || heroBlock?.content.imageUrl || null,
    }));
  }, [aiAnswers, blocks, heroBlock, pageTitle, setAiAnswers]);

  const handleAiRegenerate = async (field?: keyof WizardAnswers) => {
    try {
      await regenerateAiContent({
        blocks: blocks.filter((block) => !block.isDeleted),
        heroImageUrl: heroBlock?.content.imageUrl,
        heroImageDescription:
          heroBlock?.content.imageAlt || heroBlock?.content.caption,
        selectedField: field,
        preferredStyle: aiSelectedStyle,
      });
      toast({
        title: "Variation applied",
        description: "Page updated with regenerated content.",
      });
    } catch (error) {
      toast({
        title: "Generation error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to regenerate content",
        variant: "destructive",
      });
    }
  };

  return (
    <AiAssistDialog
      open={open}
      onOpenChange={onOpenChange}
      title="AI Assist"
      description="Choose a variation and/or update answers to regenerate About page content."
      contentClassName="overflow-hidden"
      footer={
        <div className="space-y-2">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => handleAiRegenerate(aiSelectedField || undefined)}
              disabled={isRegenerating}
            >
              {isRegenerating ? "Regenerating..." : "Regenerate*"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            * Regeneration rewrites the About page using these answers. For
            one-off block edits, adjust blocks directly in the editor.
          </p>
        </div>
      }
    >
      <AiAssistContent
        answers={aiAnswers}
        onAnswersChange={setAiAnswers}
        onSelectedFieldChange={setAiSelectedField}
        selectedStyle={aiSelectedStyle}
        onSelectedStyleChange={setAiSelectedStyle}
        cachedVariations={aiCachedVariations}
        isRegenerating={isRegenerating}
      />
    </AiAssistDialog>
  );
}
