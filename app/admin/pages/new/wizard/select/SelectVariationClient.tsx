"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Variation {
  style: "story" | "values" | "product";
  title: string;
  description: string;
  content: string;
}

export default function SelectVariationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const variationsParam = searchParams.get("variations");
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
  }, [searchParams, toast]);

  const selectedVariation = variations.find((v) => v.style === selectedStyle);

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
      const response = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "About Us",
          slug: "about",
          content: selectedVariation.content,
          metaDescription:
            "Learn about our specialty coffee roastery, our values, and our commitment to quality.",
          isPublished: false, // Save as draft for review
          showInFooter: true,
          footerOrder: 1,
          generatedBy: "ai",
          generationPrompt: {
            style: selectedVariation.style,
            wizard: true,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save page");
      }

      const page = await response.json();

      toast({
        title: "Success",
        description:
          "About page created! Review and publish when ready.",
      });

      router.push(`/admin/pages/${page.id}/edit`);
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/pages/new/wizard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
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
      </div>

      {/* Variation Selector */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-xl font-semibold">3 AI-Generated Styles</h2>
          <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
            {variations.map((variation) => (
              <div
                key={variation.style}
                className={`rounded-lg border-2 p-4 transition-colors ${
                  selectedStyle === variation.style
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={variation.style}
                    id={variation.style}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={variation.style}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {variation.title}
                        </span>
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

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save as Draft"}
          </Button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Preview</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                AI Generated
              </div>
            </div>
            {selectedVariation && (
              <div
                className="prose prose-slate max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: selectedVariation.content,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
