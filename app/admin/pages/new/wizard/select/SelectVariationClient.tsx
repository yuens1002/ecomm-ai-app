"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Check,
  X,
  Upload,
  Pencil,
  ChevronDown,
  Undo,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Typography } from "@/components/ui/typography";
import { PullQuote } from "@/components/app-components/PullQuote";
import { StatCard } from "@/components/app-components/StatCard";

interface Variation {
  style: "story" | "values" | "product";
  title: string;
  description: string;
  content: string;
  pullQuote: string;
  stats: Array<{ label: string; value: string }>;
}

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

  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [wizardAnswers, setWizardAnswers] = useState<any>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedEditField, setSelectedEditField] = useState<string>("");
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState<string>("");
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false);
  const [originalFieldValue, setOriginalFieldValue] = useState<string>("");

  useEffect(() => {
    const variationsParam = searchParams.get("variations");
    const answersParam = searchParams.get("answers");

    if (variationsParam) {
      try {
        const parsed = JSON.parse(variationsParam);
        setVariations(parsed);
        if (parsed.length > 0) {
          setSelectedStyle(parsed[0].style);
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
        setWizardAnswers(JSON.parse(answersParam));
        setEditedCaption(JSON.parse(answersParam).heroImageDescription || "");
      } catch (error) {
        console.error("Failed to parse answers:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store original field value ONLY when selection changes (not on type)
  useEffect(() => {
    if (selectedEditField) {
      setOriginalFieldValue(wizardAnswers?.[selectedEditField] || "");
    }
  }, [selectedEditField]);

  const selectedVariation = variations.find((v) => v.style === selectedStyle);

  // Convert markdown-style plain text to HTML
  const formatTextToHtml = (text: string): string => {
    if (!text) return "";

    // Split by double line breaks first
    const sections = text.split("\n\n").filter((section) => section.trim());

    let html = "";
    sections.forEach((section) => {
      const trimmed = section.trim();

      // Check for markdown-style heading (### Heading Text)
      if (trimmed.startsWith("###")) {
        const headingText = trimmed.replace(/^###\s*/, "").trim();
        html += `<h3>${headingText}</h3>\n`;
      } else {
        // Regular paragraph
        html += `<p>${trimmed}</p>\n`;
      }
    });

    return html;
  };

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
      setWizardAnswers({
        ...wizardAnswers,
        heroImageUrl: url,
      });

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
    setWizardAnswers({
      ...wizardAnswers,
      heroImageUrl: null,
      heroImageDescription: "",
    });
  };

  const handleUndoEdit = () => {
    if (!wizardAnswers || !selectedEditField) return;
    setWizardAnswers({
      ...wizardAnswers,
      [selectedEditField]: originalFieldValue,
    });
  };

  const handleSaveEdit = () => {
    if (!wizardAnswers || !selectedEditField) return;

    // Update the original value to current value, making this the new baseline
    setOriginalFieldValue(wizardAnswers[selectedEditField] || "");

    toast({
      title: "Saved",
      description: "Changes saved. Click 'Regenerate' to see updated content.",
    });
  };

  const handleRegenerate = async () => {
    if (!wizardAnswers) return;

    setIsRegenerating(true);

    try {
      const response = await fetch("/api/admin/pages/generate-about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: wizardAnswers }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to regenerate content");
      }

      const data = await response.json();
      setVariations(data.variations);
      if (data.variations.length > 0) {
        setSelectedStyle(data.variations[0].style);
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
          content: formatTextToHtml(selectedVariation.content),
          heroImage: wizardAnswers?.heroImageUrl || null,
          metaDescription:
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
                  content: formatTextToHtml(selectedVariation.content),
                  heroImage: wizardAnswers?.heroImageUrl || null,
                  metaDescription:
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
          <RadioGroup
            value={selectedStyle}
            onValueChange={setSelectedStyle}
            className="align-items-center"
            disabled={isRegenerating}
          >
            {variations.map((variation) => (
              <div
                key={variation.style}
                className={`rounded-lg border-2 p-4 transition-colors ${
                  selectedStyle === variation.style
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={variation.style}
                    id={variation.style}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor={variation.style} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{variation.title}</span>
                        {selectedStyle === variation.style && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {variation.description}
                      </p>
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>

          {wizardAnswers && (
            <>
              <div className="relative flex items-center justify-center">
                <Separator className="absolute w-full" />
                <span className="relative z-10 bg-background px-4 text-sm text-muted-foreground">
                  Regenerate a preview
                </span>
              </div>
              <div className="space-y-4">
                {/* Edit Field with Dropdown Selector */}
                <InputGroup className="w-full">
                  <InputGroupAddon align="block-start" className="border-b">
                    <InputGroupText className="text-xs text-ellipsis overflow-hidden">
                      {selectedEditField && questionMap[selectedEditField]
                        ? `Q: ${questionMap[selectedEditField]}`
                        : "Select a question to edit your response"}
                    </InputGroupText>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <InputGroupButton
                          variant="ghost"
                          size="xs"
                          className="ml-auto"
                        >
                          Questions
                          <ChevronDown className="ml-1 h-3 w-3" />
                        </InputGroupButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {Object.entries(wizardAnswers)
                          .filter(
                            ([key]) =>
                              !key.includes("Image") &&
                              key !== "heroImageDescription"
                          )
                          .map(([key]) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => setSelectedEditField(key)}
                              className="capitalize"
                            >
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </InputGroupAddon>
                  <InputGroupAddon align="block-start">
                    <InputGroupText className="font-medium text-xs">
                      <Pencil className="h-4 w-4" /> Edit responses below
                    </InputGroupText>
                    <InputGroupButton
                      onClick={handleUndoEdit}
                      disabled={
                        !selectedEditField ||
                        wizardAnswers?.[selectedEditField] ===
                          originalFieldValue
                      }
                      size="icon-sm"
                      variant="ghost"
                      className="ml-auto"
                    >
                      <Undo className="h-4 w-4" />
                      <span className="sr-only">Undo text changes</span>
                    </InputGroupButton>
                    <InputGroupButton
                      onClick={handleSaveEdit}
                      disabled={
                        !selectedEditField ||
                        wizardAnswers?.[selectedEditField] ===
                          originalFieldValue
                      }
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Save className="h-4 w-4" />
                      <span className="sr-only">Save text changes</span>
                    </InputGroupButton>
                  </InputGroupAddon>
                  <InputGroupTextarea
                    value={wizardAnswers[selectedEditField] || ""}
                    onChange={(e) =>
                      setWizardAnswers({
                        ...wizardAnswers,
                        [selectedEditField]: e.target.value,
                      })
                    }
                    placeholder={
                      selectedEditField
                        ? "Edit your answer..."
                        : "Select a question from the dropdown above to edit the response..."
                    }
                    className="min-h-[120px] text-sm"
                    disabled={!selectedEditField}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupButton
                      onClick={handleRegenerate}
                      disabled={isRegenerating || !selectedEditField}
                      size="sm"
                      variant="default"
                      className="mb-2"
                    >
                      <Sparkles
                        className={isRegenerating ? "animate-spin" : ""}
                      />
                      {isRegenerating ? "Regenerating..." : "Regenerate"}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || isRegenerating}
                className="w-full mb-4"
                size="lg"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save as Draft"}
              </Button>
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
                            __html: formatTextToHtml(selectedVariation.content),
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
