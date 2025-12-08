"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Block,
  BlockType,
  HeroBlock,
  RichTextBlock,
} from "@/lib/blocks/schemas";
import { cn } from "@/lib/utils";
import {
  canAddBlock,
  getBlockDisplayName,
  isAtMinimumCount,
  PAGE_LAYOUTS,
  getFilteredAllowedBlocks,
} from "@/lib/page-layouts";
import { LayoutRenderer, BlockHandlers } from "@/lib/page-layouts";
import { PageType } from "@prisma/client";
import { LocationType } from "@/lib/app-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Save,
  Settings,
  X,
  ChevronsUpDown,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  DynamicIcon,
  getAvailableIcons,
  COMMON_PAGE_ICONS,
} from "@/components/app-components/DynamicIcon";
import { AboutAnswerEditor } from "@/components/app-components/AboutAnswerEditor";
import { AiAssistDialog } from "@/components/app-components/AiAssistDialog";
import {
  GeneratedVariation,
  WizardAnswers,
} from "@/lib/api-schemas/generate-about";
import { useAiAssist } from "@/lib/ai-assist/useAiAssist";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { addBlock, updateBlock, deleteBlock } from "@/lib/blocks/actions";
import { PendingBlockDialog } from "@/components/blocks/PendingBlockDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const isHeroBlock = (block: Block): block is HeroBlock => block.type === "hero";
const isRichTextBlock = (block: Block): block is RichTextBlock =>
  block.type === "richText";

interface PageEditorProps {
  pageId: string;
  pageType: PageType;
  pageSlug: string;
  pageTitle: string;
  initialBlocks: Block[];
  layoutRenderer: LayoutRenderer;
  isPublished?: boolean;
  metaDescription?: string | null;
  showInHeader?: boolean;
  showInFooter?: boolean;
  footerOrder?: number | null;
  headerOrder?: number | null;
  icon?: string | null;
  locationType?: LocationType; // Optional - only needed for CAFE pages
  initialWizardAnswers?: WizardAnswers;
  onPublishToggle?: () => Promise<void>;
  onMetadataUpdate?: (data: {
    title: string;
    metaDescription: string;
    isPublished?: boolean;
    showInHeader?: boolean;
    showInFooter?: boolean;
    headerOrder?: number | null;
    footerOrder?: number | null;
    icon?: string | null;
  }) => Promise<void>;
}

export function PageEditor({
  pageId,
  pageType,
  pageSlug,
  pageTitle,
  initialBlocks,
  layoutRenderer,
  isPublished,
  metaDescription,
  showInHeader: initialShowInHeader,
  showInFooter: initialShowInFooter,
  footerOrder,
  headerOrder,
  icon,
  locationType,
  initialWizardAnswers,
  onPublishToggle: _onPublishToggle,
  onMetadataUpdate,
}: PageEditorProps) {
  const aiAnswersInitializedRef = useRef(false);
  const fallbackWizardAnswers: WizardAnswers = {
    businessName: pageTitle || "",
    foundingStory:
      "Our team started roasting to share vibrant, origin-forward coffees with our community.",
    uniqueApproach:
      "Small-batch roasting with meticulous profiles to highlight sweetness and clarity.",
    coffeeSourcing:
      "Long-term relationships with trusted importers and producers across Central and East Africa.",
    roastingPhilosophy: "Light roasts to highlight origin characteristics",
    targetAudience:
      "Coffee enthusiasts who appreciate traceable, thoughtfully roasted single origins and blends.",
    brandPersonality: "friendly",
    keyValues:
      "Quality, transparency, community, sustainability, and hospitality.",
    communityRole:
      "We host public cuppings, donate to local food programs, and collaborate with neighborhood makers.",
    futureVision:
      "Grow responsible sourcing partnerships and open more educational community events.",
    heroImageUrl: null,
    heroImageDescription: null,
    previousHeroImageUrl: null,
  };
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [pendingBlock, setPendingBlock] = useState<{
    type: BlockType;
    afterBlockId?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [title, setTitle] = useState(pageTitle);
  const [description, setDescription] = useState(metaDescription || "");
  const [published, setPublished] = useState(isPublished || false);
  const [savedPublished, setSavedPublished] = useState(isPublished || false); // Tracks last saved state
  const [showInHeader, setShowInHeader] = useState(
    initialShowInHeader || false
  );
  const [showFooter, setShowFooter] = useState(initialShowInFooter || false);
  const [headerOrderValue, setHeaderOrderValue] = useState(headerOrder || 0);
  const [footerOrderValue, setFooterOrderValue] = useState(footerOrder || 0);
  const [iconValue, setIconValue] = useState(icon || "");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

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
    initialAnswers: initialWizardAnswers || fallbackWizardAnswers,
    onApplied: ({ blocks: appliedBlocks, metaDescription: appliedMeta }) => {
      if (appliedBlocks?.length) {
        setBlocks([...appliedBlocks].sort((a, b) => a.order - b.order));
      }
      if (typeof appliedMeta === "string") {
        setDescription(appliedMeta);
      }
      setAiDialogOpen(false);
    },
  });

  useEffect(() => {
    // Re-seed answers if they arrive later (e.g., server-fetched defaults) but avoid clobbering user edits
    if (initialWizardAnswers && !aiAnswersInitializedRef.current) {
      setAiAnswers(initialWizardAnswers);
      aiAnswersInitializedRef.current = true;
    }
  }, [initialWizardAnswers, setAiAnswers]);

  const stripHtml = (html?: string | null) => {
    if (!html) return "";
    return html
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  useEffect(() => {
    // If answers are still blank, seed them from existing page content for context
    const hasUserEdits = Object.values(aiAnswers).some((v) => v);
    if (hasUserEdits) return;

    const heroBlock = initialBlocks.find(
      (b): b is HeroBlock => isHeroBlock(b) && !b.isDeleted
    );
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
  }, [aiAnswers, blocks, initialBlocks, pageTitle, setAiAnswers]);
  const [iconOpen, setIconOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const { toast } = useToast();

  // Convert PascalCase to readable format (e.g., "CircleQuestionMark" -> "Circle Question Mark")
  const formatIconName = (name: string) => {
    return name.replace(/([A-Z])/g, " $1").trim();
  };

  // Get all available icons and filter based on search
  const allIcons = useMemo(() => getAvailableIcons(), []);
  const filteredIcons = useMemo(() => {
    if (!iconSearch) return COMMON_PAGE_ICONS;
    const search = iconSearch.toLowerCase();
    return allIcons.filter(
      (icon) =>
        icon.toLowerCase().includes(search) ||
        formatIconName(icon).toLowerCase().includes(search)
    );
  }, [iconSearch, allIcons]);

  const layout = PAGE_LAYOUTS[pageType];

  if (!layout) {
    throw new Error(`No layout configuration found for page type: ${pageType}`);
  }

  const handleAddBlock = (blockType: BlockType, afterBlockId?: string) => {
    const currentBlockCounts = blocks.reduce(
      (acc, block) => {
        acc[block.type] = (acc[block.type] || 0) + 1;
        return acc;
      },
      {} as Record<BlockType, number>
    );

    if (!canAddBlock(pageType, blockType, currentBlockCounts[blockType] || 0)) {
      toast({
        title: "Cannot add block",
        description: `Maximum ${getBlockDisplayName(blockType)} blocks reached for this page type.`,
        variant: "destructive",
      });
      return;
    }

    // Just set pending state to open the dialog
    setPendingBlock({ type: blockType, afterBlockId });
  };

  const handleConfirmAddBlock = async (blockData: Block) => {
    if (!pendingBlock) return;

    const { type: blockType, afterBlockId } = pendingBlock;

    // Calculate insertion order
    let insertOrder: number;
    if (afterBlockId) {
      const afterBlock = blocks.find((b) => b.id === afterBlockId);
      insertOrder = afterBlock ? afterBlock.order + 1 : blocks.length;
    } else {
      insertOrder = blocks.length;
    }

    // Update order of existing blocks that come after
    const updatedBlocks = blocks.map((b) =>
      b.order >= insertOrder ? { ...b, order: b.order + 1 } : b
    );

    // Update orders in database for affected blocks
    for (const block of updatedBlocks.filter((b) => b.order >= insertOrder)) {
      await updateBlock(pageId, block);
    }

    setBlocks(updatedBlocks);

    // Create the new block in database
    const result = await addBlock(pageId, blockType, insertOrder);

    if ("error" in result) {
      console.error("Block validation error:", result);
      toast({
        title: "Error adding block",
        description:
          result.error + (result.details ? ` - Check console for details` : ""),
        variant: "destructive",
      });
      setPendingBlock(null);
      return;
    }

    if (result.block) {
      // Update the block with the user's content
      const finalBlock = { ...result.block, content: blockData.content };
      await updateBlock(pageId, finalBlock);

      const newBlocks = [...updatedBlocks, finalBlock].sort(
        (a, b) => a.order - b.order
      );
      setBlocks(newBlocks as Block[]);
      setPendingBlock(null);

      toast({
        title: "Block added",
        description: `${getBlockDisplayName(blockType)} block added successfully.`,
      });
    }
  };

  const handleUpdateBlock = async (updatedBlock: Block) => {
    console.log(
      "PageEditor - handleUpdateBlock called with:",
      JSON.stringify(updatedBlock, null, 2)
    );

    const result = await updateBlock(pageId, updatedBlock);

    if ("error" in result) {
      console.error("PageEditor - Update block error:", result);
      toast({
        title: "Error updating block",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setBlocks(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));

    toast({
      title: "Block updated",
      description: "Block updated successfully.",
    });
  };

  const handleCancelAddBlock = () => {
    setPendingBlock(null);
  };

  const handleDeleteBlock = async (blockId: string) => {
    const blockToDelete = blocks.find((b) => b.id === blockId);
    if (!blockToDelete) return;

    // Count how many blocks of this type exist (excluding already deleted ones)
    const activeBlocksOfType = blocks.filter(
      (b) => b.type === blockToDelete.type && !b.isDeleted
    ).length;

    // Check if this block type is at minimum count
    const isAtMinimum = isAtMinimumCount(
      pageType,
      blockToDelete.type,
      activeBlocksOfType
    );

    console.log("Delete block debug:", {
      blockType: blockToDelete.type,
      activeCount: activeBlocksOfType,
      isAtMinimum,
      pageType,
    });

    if (isAtMinimum) {
      // Soft delete - mark as deleted but keep in database for restore
      const updatedBlock = { ...blockToDelete, isDeleted: true };
      const result = await updateBlock(pageId, updatedBlock);

      if ("error" in result) {
        toast({
          title: "Error deleting block",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setBlocks(blocks.map((b) => (b.id === blockId ? updatedBlock : b)));
      toast({
        title: "Block hidden",
        description:
          "This is a required block. Click restore to bring it back.",
      });
    } else {
      // Hard delete - remove completely from database and UI
      const result = await deleteBlock(pageId, blockId);

      if ("error" in result) {
        toast({
          title: "Error deleting block",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setBlocks(blocks.filter((b) => b.id !== blockId));
      toast({
        title: "Block deleted",
        description: "Block has been permanently removed.",
      });
    }
  };

  const handleRestoreBlock = async (blockId: string) => {
    const blockToRestore = blocks.find((b) => b.id === blockId);
    if (!blockToRestore) return;

    const updatedBlock = { ...blockToRestore, isDeleted: false };
    const result = await updateBlock(pageId, updatedBlock);

    if ("error" in result) {
      toast({
        title: "Error restoring block",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setBlocks(blocks.map((b) => (b.id === blockId ? updatedBlock : b)));
    toast({
      title: "Block restored",
      description: "Block has been restored successfully.",
    });
  };

  const handleMetadataSave = async () => {
    if (!onMetadataUpdate) return;

    setIsSaving(true);
    try {
      await onMetadataUpdate({
        title,
        metaDescription: description,
        isPublished: published,
        showInHeader,
        showInFooter: showFooter,
        headerOrder: headerOrderValue,
        footerOrder: footerOrderValue,
        icon: iconValue || null,
      });
      setSavedPublished(published); // Update saved state on success
      setIsEditingMetadata(false);
      toast({
        title: "Settings updated",
        description: "Page settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get allowed blocks - filtered by location type for CAFE pages
  const _baseAllowedBlocks =
    pageType === PageType.CAFE && locationType
      ? getFilteredAllowedBlocks(locationType)
      : layout.allowedBlocks;

  // Open live preview in new tab
  // Use savedPublished state (last saved DB state) not published state (UI toggle)
  const handleViewLive = () => {
    const url = savedPublished
      ? `/pages/${pageSlug}`
      : `/pages/${pageSlug}?preview=true`;
    window.open(url, "_blank");
  };

  const handleAiRegenerate = async (field?: keyof WizardAnswers) => {
    const heroBlock = blocks.find(
      (block): block is HeroBlock => isHeroBlock(block) && !block.isDeleted
    );

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

  // Check if a block can be deleted (not at minimum count)
  const canDeleteBlock = (block: Block): boolean => {
    // Count how many active blocks of this type exist
    const activeBlocksOfType = blocks.filter(
      (b) => b.type === block.type && !b.isDeleted
    ).length;

    // If at minimum, can't delete
    return !isAtMinimumCount(pageType, block.type, activeBlocksOfType);
  };

  // Block handlers to pass to layout renderer
  const blockHandlers: BlockHandlers & {
    pendingBlock: { type: BlockType; afterBlockId?: string } | null;
    onConfirmAddBlock: (blockData: Block) => Promise<void>;
    onCancelAddBlock: () => void;
  } = {
    onUpdate: handleUpdateBlock,
    onDelete: handleDeleteBlock,
    onRestore: handleRestoreBlock,
    onSelect: setSelectedBlockId,
    onAddBlock: handleAddBlock,
    selectedBlockId,
    pendingBlock,
    onConfirmAddBlock: handleConfirmAddBlock,
    onCancelAddBlock: handleCancelAddBlock,
    canDeleteBlock,
    pageSlug,
  };

  return (
    <>
      {/* Toolbar */}
      <div className="w-full sticky -top-50 z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {pageType.charAt(0).toUpperCase() + pageType.slice(1)} Page Editor
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewLive}
            disabled={isEditingMetadata}
          >
            <Eye className="h-4 w-4 mr-2" />
            {savedPublished ? "Live Preview" : "Preview"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onMetadataUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingMetadata(!isEditingMetadata)}
              disabled={isEditingMetadata}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => setAiDialogOpen(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assist
          </Button>
        </div>
      </div>

      <AiAssistDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        title="AI Assist"
        description="Choose a variation and/or update answers to regenerate About page content."
        contentClassName="overflow-hidden"
        footer={
          <div className="space-y-2">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 min-h-[140px]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Variations</h4>
              <span className="text-xs text-muted-foreground">
                {isRegenerating
                  ? "Generating new options..."
                  : "Pick a style and regenerate"}
              </span>
            </div>

            {isRegenerating ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Crafting fresh options…</span>
              </div>
            ) : (
              <RadioGroup
                value={aiSelectedStyle}
                onValueChange={(val) =>
                  setAiSelectedStyle(val as GeneratedVariation["style"])
                }
                className="space-y-3"
              >
                {["story", "values", "product"].map((style) => (
                  <label
                    key={style}
                    className={cn(
                      "flex gap-3 rounded-lg border p-3 hover:border-primary/50",
                      aiSelectedStyle === style
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <RadioGroupItem value={style} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {style}
                        </span>
                        <span className="text-sm font-semibold">
                          {style === "story"
                            ? "Story-first"
                            : style === "values"
                              ? "Values-forward"
                              : "Product-first"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {style === "story"
                          ? "Narrative, warm, founder journey focus"
                          : style === "values"
                            ? "Principles-led, trustworthy, mission first"
                            : "Coffee-forward, educational, craft-driven"}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            )}

            {aiCachedVariations.length > 0 && !isRegenerating && (
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Cached variations (titles)
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {aiCachedVariations.map((v, idx) => (
                    <li key={`${v.style}-${idx}`} className="line-clamp-1">
                      {v.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground pb-4">
              Edit these answers to guide the AI when regenerating your About
              page content.
            </p>
            <AboutAnswerEditor
              answers={aiAnswers}
              onAnswersChange={setAiAnswers}
              onSelectedFieldChange={setAiSelectedField}
              isRegenerating={isRegenerating}
            />
          </div>
        </div>
      </AiAssistDialog>

      {/* SEO Metadata Panel */}
      {isEditingMetadata && onMetadataUpdate && (
        <div className="container pt-6">
          <Card className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingMetadata(false)}
              className="absolute top-2 right-2 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
            <CardContent>
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Page Settings</FieldLegend>
                  <FieldDescription>
                    Manage page title and meta description for search engines
                  </FieldDescription>

                  <div className="grid grid-cols-1 lg:grid-cols-[350px_auto_1fr] gap-8">
                    {/* Left Column - Controls */}
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="published"
                            className="text-sm font-medium"
                          >
                            Published
                          </Label>
                          <Switch
                            id="published"
                            checked={published}
                            onCheckedChange={setPublished}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Make this page publicly visible
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Show Page Link</h4>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-header"
                            checked={showInHeader}
                            onCheckedChange={(checked) =>
                              setShowInHeader(checked === true)
                            }
                          />
                          <Label
                            htmlFor="show-header"
                            className="text-sm cursor-pointer"
                          >
                            Site Header
                          </Label>
                        </div>
                        {showInHeader && (
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="header-order"
                              className="text-sm font-medium"
                            >
                              Display Order
                            </Label>
                            <Input
                              id="header-order"
                              type="number"
                              min="0"
                              value={headerOrderValue}
                              onChange={(e) =>
                                setHeaderOrderValue(
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 h-8"
                            />
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-footer"
                            checked={showFooter}
                            onCheckedChange={(checked) =>
                              setShowFooter(checked === true)
                            }
                          />
                          <Label
                            htmlFor="show-footer"
                            className="text-sm cursor-pointer"
                          >
                            Site Footer
                          </Label>
                        </div>
                        {showFooter && (
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="footer-order"
                              className="text-sm font-medium"
                            >
                              Display Order
                            </Label>
                            <Input
                              id="footer-order"
                              type="number"
                              min="0"
                              value={footerOrderValue}
                              onChange={(e) =>
                                setFooterOrderValue(
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 h-8"
                            />
                          </div>
                        )}
                      </div>

                      {(showInHeader || showFooter) && (
                        <div className="flex space-x-4 items-center justify-between">
                          <Label
                            htmlFor="link-icon"
                            className="text-sm font-medium whitespace-nowrap"
                          >
                            Link Icon
                          </Label>
                          <Popover open={iconOpen} onOpenChange={setIconOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                id="link-icon"
                                variant="outline"
                                role="combobox"
                                aria-expanded={iconOpen}
                                className="justify-between bg-transparent"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {iconValue ? (
                                    <>
                                      <DynamicIcon name={iconValue} size={16} />
                                      <span className="truncate">
                                        {formatIconName(iconValue)}
                                      </span>
                                    </>
                                  ) : (
                                    "Pick an icon or none..."
                                  )}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
                              <Command shouldFilter={false}>
                                <CommandInput
                                  placeholder="Search icons..."
                                  value={iconSearch}
                                  onValueChange={setIconSearch}
                                />
                                <CommandEmpty>No icon found.</CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    <CommandItem
                                      value="none"
                                      onSelect={() => {
                                        setIconValue("");
                                        setIconSearch("");
                                        setIconOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !iconValue
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      None
                                    </CommandItem>
                                    {filteredIcons
                                      .slice(0, 50)
                                      .map((iconName: string) => (
                                        <CommandItem
                                          key={iconName}
                                          value={iconName}
                                          onSelect={() => {
                                            setIconValue(iconName);
                                            setIconSearch("");
                                            setIconOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              iconValue === iconName
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <DynamicIcon
                                            name={iconName}
                                            size={16}
                                            className="mr-2"
                                          />
                                          {formatIconName(iconName)}
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>

                    <div className="hidden lg:block">
                      <Separator orientation="vertical" />
                    </div>

                    <div className="space-y-6">
                      <Field>
                        <FormHeading
                          htmlFor="page-title"
                          label="Page Title"
                          required={true}
                        />
                        <Input
                          id="page-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter page title"
                          maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {title.length}/60 characters (optimal: 50-60)
                        </p>
                      </Field>

                      <Field>
                        <FormHeading
                          htmlFor="meta-description"
                          label="Meta Description"
                        />
                        <Textarea
                          id="meta-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Enter a brief description of this page for search engines"
                          rows={3}
                          maxLength={160}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {description.length}/160 characters (optimal: 150-160)
                        </p>
                      </Field>
                    </div>

                    {/* Right Column - Toggles */}
                  </div>
                </FieldSet>
              </FieldGroup>

              <div className="flex justify-end mt-6 ">
                <Button onClick={handleMetadataSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Blocks Container - WYSIWYG Layout */}
      <div className="container pt-6">
        {blocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No blocks yet</p>
            <p className="text-sm">
              Click &ldquo;Add Block&rdquo; above to get started
            </p>
          </div>
        ) : (
          layoutRenderer(blocks, blockHandlers)
        )}
      </div>

      {/* Dialog for adding new blocks */}
      {pendingBlock && (
        <PendingBlockDialog
          blockType={pendingBlock.type}
          isOpen={!!pendingBlock}
          onConfirm={handleConfirmAddBlock}
          onCancel={handleCancelAddBlock}
        />
      )}
    </>
  );
}
