// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles, Check, X, Upload, Pencil } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Typography } from "@/components/ui/typography";
import { PullQuote } from "@/components/app-components/PullQuote";
import { StatCard } from "@/components/app-components/StatCard";
import { OptionCardGroup } from "@/components/admin/OptionCardGroup";
import {
  GenerateAboutRequest,
  GeneratedVariation,
  WizardAnswers,
} from "@/lib/api-schemas/generate-about";
import { AboutAnswerEditor } from "@/components/app-components/AboutAnswerEditor";
import { SaveButton } from "@/components/admin/SaveButton";

type UiVariation = {
  style: "story" | "values" | "product";
  title: string;
  description: string;
  contentHtml: string;
  pullQuote?: string;
  stats: Array<{ label: string; value: string }>;
  metaDescription?: string | null;
  heroImageUrl?: string | null;
  heroAltText?: string | null;
};

const questionMap: Record<string, string> = {
  businessName: "What's your business name?",
  foundingStory: "How did your coffee journey begin?",
  uniqueApproach: "What makes your approach unique?",
  coffeeSourcing: "How do you source your coffee?",
  roastingPhilosophy: "What's your roasting philosophy?",
  targetAudience: "Who do you roast for?",
  brandPersonality: "How would you describe your brand?",
  keyValues: "What are your core values?",
  communityRole: "What role do you play in your community?",
  futureVision: "Where do you see your roastery in 5 years?",
};

export default function SelectVariationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const defaultAnswers: WizardAnswers = {
    businessName: "",
    foundingStory: "",
    uniqueApproach: "",
    coffeeSourcing: "",
    roastingPhilosophy: "",
    targetAudience: "",
    brandPersonality: "friendly",
    keyValues: "",
    communityRole: "",
    futureVision: "",
    heroImageUrl: null,
    heroImageDescription: null,
    previousHeroImageUrl: null,
  };

  const [variations, setVariations] = useState<UiVariation[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [wizardAnswers, setWizardAnswers] =
    useState<WizardAnswers>(defaultAnswers);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState<string>("");
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false);

  const normalizeVariation = (variation: GeneratedVariation): UiVariation => {
    const blocks = variation.blocks || [];

    const stats = blocks
      .filter((block) => block.type === "stat")
      .map((block) => ({
        label: block.content?.label || "",
        value: block.content?.value || "",
      }));

    const pullQuote = blocks.find((block) => block.type === "pullQuote")
      ?.content?.text;

    const contentHtml = blocks
      .filter((block) => block.type === "richText")
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((block) => block.content?.html || "")
      .join("\n\n");

    const heroBlock = blocks.find((block) => block.type === "hero");

    return {
      style: variation.style,
      title: variation.title,
      description: variation.description,
      contentHtml,
      pullQuote: pullQuote || "",
      stats,
      metaDescription: variation.metaDescription,
      heroImageUrl: variation.heroImageUrl || heroBlock?.content?.imageUrl,
      heroAltText: variation.heroAltText || heroBlock?.content?.altText,
    };
  };

  useEffect(() => {
    const variationsParam = searchParams.get("variations");
    const answersParam = searchParams.get("answers");

    if (variationsParam) {
      try {
        const parsed = JSON.parse(variationsParam) as GeneratedVariation[];
        const normalized = parsed.map(normalizeVariation);
        setVariations(normalized);
        if (normalized.length > 0) {
          setSelectedStyle(normalized[0].style);
        }
      } catch (error) {
        console.error("Failed to parse variations:", error);
        toast({
          title: "Error",
          description: "Failed to load generated variations",
          variant: "destructive",
        });
      }
    }

    if (answersParam) {
      try {
        const parsed = JSON.parse(answersParam) as Partial<WizardAnswers>;
        setWizardAnswers({ ...defaultAnswers, ...parsed });
        setEditedCaption(parsed.heroImageDescription || "");
      } catch (error) {
        console.error("Failed to parse answers:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedVariation = variations.find((v) => v.style === selectedStyle);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploadingNewImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload-hero-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const { url } = await response.json();
      setWizardAnswers((prev) => ({
        ...prev,
        heroImageUrl: url,
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingNewImage(false);
    }
  };

  const handleRemoveImage = () => {
    setWizardAnswers((prev) => ({
      ...prev,
      heroImageUrl: null,
      heroImageDescription: "",
    }));
  };

  const handleRegenerate = async () => {
    if (!wizardAnswers) return;

    setIsRegenerating(true);

    try {
      const payload: GenerateAboutRequest = { answers: wizardAnswers };

      const response = await fetch("/api/admin/pages/about/generate-about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to regenerate content");
      }

      const data = await response.json();
      const normalized = (data.variations as GeneratedVariation[]).map(
        normalizeVariation
      );

      setVariations(normalized);
      if (normalized.length > 0) {
        setSelectedStyle(normalized[0].style);
      }

      toast({
        title: "✨ Preview Updated",
        description: "Your new content variations are ready to review",
      });

      // Scroll preview into view
      const previewElement = document.querySelector("[data-preview-section]");
      if (previewElement) {
        previewElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch (error) {
      console.error("Regenerate error:", error);
      toast({
        title: "Generation Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to regenerate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedVariation) {
      toast({
        title: "Error",
        description: "Please select a variation",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Try to create the page
      const response = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "About Us",
          slug: "about",
          content: selectedVariation.contentHtml,
          heroImage: wizardAnswers?.heroImageUrl || null,
          metaDescription:
            selectedVariation.metaDescription ||
            "Learn about our specialty coffee roastery, our values, and our commitment to quality.",
          isPublished: false, // Save as draft for review
          showInFooter: true,
          footerOrder: 1,
          generatedBy: "ai",
          generationPrompt: {
            style: selectedVariation.style,
            wizard: true,
            pullQuote: selectedVariation.pullQuote,
            stats: selectedVariation.stats,
            heroImageDescription: wizardAnswers?.heroImageDescription || null,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // If slug exists, try to find and update the existing page
        if (error.error?.includes("slug already exists")) {
          // Get the existing page by querying with slug parameter
          const existingPage = await fetch(
            "/api/admin/pages/by-slug?slug=about"
          );

          if (existingPage.ok) {
            const pageData = await existingPage.json();

            // Update the existing page
            const updateResponse = await fetch(
              `/api/admin/pages/${pageData.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: "About Us",
                  content: selectedVariation.contentHtml,
                  heroImage: wizardAnswers?.heroImageUrl || null,
                  metaDescription:
                    selectedVariation.metaDescription ||
                    "Learn about our specialty coffee roastery, our values, and our commitment to quality.",
                  isPublished: false,
                  showInFooter: true,
                  footerOrder: 1,
                  generatedBy: "ai",
                  generationPrompt: {
                    style: selectedVariation.style,
                    wizard: true,
                    pullQuote: selectedVariation.pullQuote,
                    stats: selectedVariation.stats,
                    heroImageDescription:
                      wizardAnswers?.heroImageDescription || null,
                  },
                }),
              }
            );

            if (!updateResponse.ok) {
              throw new Error("Failed to update existing page");
            }

            const updatedPage = await updateResponse.json();

            toast({
              title: "Success",
              description: "About page updated! Review and publish when ready.",
            });

            router.push(`/admin/pages/edit/${updatedPage.id}`);
            return;
          }
        }

        throw new Error(error.error || "Failed to save page");
      }

      const page = await response.json();

      toast({
        title: "Success",
        description: "About page created! Review and publish when ready.",
      });

      router.push(`/admin/pages/edit/${page.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save page",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  if (variations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/pages/new/wizard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-bold">Choose Your Style</h1>
          </div>
          <p className="text-muted-foreground">
            Select the version that best represents your brand
          </p>
        </div>
      </div>

      {/* Variation Selector */}
      <div className="grid gap-6 lg:grid-cols-3 pb-8 lg:pb-0">
        <div className="space-y-4 lg:col-span-1 order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <OptionCardGroup
            value={selectedStyle}
            onValueChange={setSelectedStyle}
            disabled={isRegenerating}
            options={variations.map((variation) => ({
              value: variation.style,
              title: variation.title,
              description: variation.description,
              hint:
                selectedStyle === variation.style ? (
                  <div className="flex items-center gap-2 text-xs text-primary font-medium">
                    <Check className="h-4 w-4" /> Selected
                  </div>
                ) : null,
            }))}
          />

          {wizardAnswers && (
            <>
              <AboutAnswerEditor
                answers={wizardAnswers}
                onAnswersChange={(next) => setWizardAnswers({ ...next })}
                isRegenerating={isRegenerating}
                questionLabels={questionMap}
              />
              <SaveButton
                onClick={handleSave}
                isSaving={isSaving}
                disabled={isRegenerating}
                className="w-full mb-4"
                size="lg"
                label="Save as Draft"
                savingLabel="Saving..."
              />
            </>
          )}
        </div>

        {/* Preview */}
        <div
          className="lg:col-span-2 order-1 lg:order-2 pb-6 lg:pb-0"
          data-preview-section
        >
          <div
            className={`rounded-lg border overflow-hidden transition-all duration-500 ${
              isRegenerating
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            {/* Preview Header */}
            <div className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Preview</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  AI Generated
                </div>
              </div>
            </div>

            {/* Hero Image Preview - Editable */}
            {wizardAnswers?.heroImageUrl && (
              <div className="space-y-3">
                <div className="relative w-full aspect-video">
                  <Image
                    src={wizardAnswers.heroImageUrl}
                    alt="Hero image preview"
                    fill
                    className="object-cover"
                  />

                  {/* Image Controls - Always Visible */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 shadow-lg"
                      onClick={() =>
                        document
                          .getElementById("change-preview-hero-image")
                          ?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 shadow-lg"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <input
                    id="change-preview-hero-image"
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </div>

                {/* Caption Editor Below Image */}
                <div className="px-8">
                  {isEditingCaption ? (
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        value={wizardAnswers.heroImageDescription || ""}
                        onChange={(e) =>
                          setWizardAnswers({
                            ...wizardAnswers,
                            heroImageDescription: e.target.value,
                          })
                        }
                        placeholder="Enter image caption..."
                        className="max-w-md text-sm"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setIsEditingCaption(false)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setIsEditingCaption(true)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <span className="italic">
                        {wizardAnswers.heroImageDescription || "No caption"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Preview */}
            <div className="p-8">
              <div className="mb-8"></div>

              {selectedVariation && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  {selectedVariation.stats &&
                    selectedVariation.stats.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedVariation.stats.map((stat, index) => (
                          <StatCard
                            key={index}
                            label={stat.label}
                            value={stat.value}
                          />
                        ))}
                      </div>
                    )}

                  {/* Two-Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Pull Quote */}
                    <div className="lg:col-span-1">
                      {selectedVariation.pullQuote && (
                        <PullQuote text={selectedVariation.pullQuote} />
                      )}
                    </div>

                    {/* Right Column - Main Content */}
                    <div className="lg:col-span-2">
                      <Typography>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: selectedVariation.contentHtml,
                          }}
                        />
                      </Typography>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
