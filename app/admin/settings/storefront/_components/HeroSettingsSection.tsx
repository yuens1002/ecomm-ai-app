"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageField } from "@/app/admin/_components/cms/fields/ImageField";
import { ImageListField } from "@/app/admin/_components/cms/fields/ImageListField";
import {
  useImageUpload,
  useMultiImageUpload,
} from "@/app/admin/_hooks/useImageUpload";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { Hero } from "@/app/(site)/_components/content/Hero";
import { useToast } from "@/hooks/use-toast";
import type { HeroSlide } from "@/lib/site-settings";

type HeroType = "image" | "carousel" | "video";
type ImageMode = "single" | "slideshow";
type ActiveTab = "image-slides" | "video";

interface HeroSettings {
  homepageHeroType: HeroType;
  homepageHeroSlides: HeroSlide[];
  homepageHeroVideoUrl: string;
  homepageHeroVideoPosterUrl: string;
  homepageHeroHeading: string;
  homepageHeroTagline: string;
}

export function HeroSettingsSection() {
  const { toast } = useToast();

  // Server state
  const [savedSettings, setSavedSettings] = useState<HeroSettings | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>("image-slides");
  const [imageMode, setImageMode] = useState<ImageMode>("single");
  const [heading, setHeading] = useState("");
  const [tagline, setTagline] = useState("");

  // Video state (manual — no hook for video)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [savedVideoUrl, setSavedVideoUrl] = useState("");

  // Slides (deferred upload)
  const {
    imageListFieldImages,
    pendingFilesMap,
    handleImageListFieldFileSelect,
    handleImageListFieldChange,
    uploadAll: uploadAllSlides,
  } = useMultiImageUpload({
    currentImages: savedSettings?.homepageHeroSlides ?? [],
    minImages: 1,
    maxImages: 10,
  });

  // Poster image (deferred upload)
  const {
    pendingFile: pendingPosterFile,
    previewUrl: posterPreviewUrl,
    displayUrl: posterDisplayUrl,
    handleFileSelect: handlePosterFileSelect,
    uploadFile: uploadPosterFile,
  } = useImageUpload({
    currentUrl: savedSettings?.homepageHeroVideoPosterUrl ?? "",
  });

  // Load settings on mount
  useEffect(() => {
    fetch("/api/admin/settings/hero-media")
      .then((res) => res.json())
      .then((data: HeroSettings) => {
        setSavedSettings(data);
        setHeading(data.homepageHeroHeading);
        setTagline(data.homepageHeroTagline);
        setSavedVideoUrl(data.homepageHeroVideoUrl);
        if (data.homepageHeroType === "video") {
          setActiveTab("video");
        } else {
          setActiveTab("image-slides");
          setImageMode(
            data.homepageHeroType === "carousel" ? "slideshow" : "single"
          );
        }
      })
      .catch(() => {
        toast({ title: "Failed to load hero settings", variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, [toast]);

  const handleVideoFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("video/")) {
        toast({ title: "File must be a video", variant: "destructive" });
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Video must be under 100 MB",
          variant: "destructive",
        });
        return;
      }

      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    },
    [videoPreviewUrl, toast]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // 1. Upload all pending slide images
      const uploadedSlides = await uploadAllSlides();

      // 2. Upload video if a new file was selected
      let finalVideoUrl = savedVideoUrl;
      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);
        if (savedVideoUrl) formData.append("oldPath", savedVideoUrl);

        const res = await fetch("/api/upload/video", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Video upload failed");

        const data = (await res.json()) as { path: string };
        finalVideoUrl = data.path;
        setSavedVideoUrl(finalVideoUrl);
        if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        setVideoFile(null);
        setVideoPreviewUrl(null);
      }

      // 3. Upload poster if a new file was selected
      let finalPosterUrl = savedSettings?.homepageHeroVideoPosterUrl ?? "";
      if (pendingPosterFile) {
        const uploaded = await uploadPosterFile();
        if (uploaded) finalPosterUrl = uploaded;
      }

      // 4. Determine hero type from active tab + image mode radio
      const heroType: HeroType =
        activeTab === "video"
          ? "video"
          : imageMode === "slideshow"
            ? "carousel"
            : "image";

      // 5. Save settings to DB
      const res = await fetch("/api/admin/settings/hero-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homepageHeroType: heroType,
          homepageHeroSlides: uploadedSlides,
          homepageHeroVideoUrl: finalVideoUrl,
          homepageHeroVideoPosterUrl: finalPosterUrl,
          homepageHeroHeading: heading,
          homepageHeroTagline: tagline,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      const saved = (await res.json()) as HeroSettings;
      setSavedSettings(saved);

      toast({ title: "Hero settings saved" });
    } catch {
      toast({ title: "Failed to save hero settings", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [
    activeTab,
    imageMode,
    heading,
    tagline,
    videoFile,
    videoPreviewUrl,
    savedVideoUrl,
    savedSettings,
    pendingPosterFile,
    uploadAllSlides,
    uploadPosterFile,
    toast,
  ]);

  // Derive preview values from current form state
  const previewType: HeroType =
    activeTab === "video"
      ? "video"
      : imageMode === "slideshow"
        ? "carousel"
        : "image";

  const previewSlides = imageListFieldImages.filter((img) => img.url);
  const previewVideoUrl = videoPreviewUrl ?? savedVideoUrl;
  const previewPosterUrl = posterPreviewUrl ?? posterDisplayUrl;

  return (
    <SettingsSection
      icon={<ImageIcon className="h-5 w-5" />}
      title="Homepage Hero"
      description="Configure the hero displayed at the top of your homepage. Choose between a static image, a rotating slideshow, or a looping video."
      action={
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_3fr]">
          {/* ── Form panel (40%) ── */}
          <div className="space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as ActiveTab)}
            >
              <TabsList>
                <TabsTrigger value="image-slides">Image / Slides</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
              </TabsList>

              {/* Image / Slides tab */}
              <TabsContent value="image-slides" className="mt-4 space-y-4">
                <RadioGroup
                  value={imageMode}
                  onValueChange={(v) => setImageMode(v as ImageMode)}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="single" id="mode-single" />
                    <Label htmlFor="mode-single" className="cursor-pointer">
                      Single image
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="slideshow" id="mode-slideshow" />
                    <Label
                      htmlFor="mode-slideshow"
                      className="cursor-pointer"
                    >
                      Slideshow
                    </Label>
                  </div>
                </RadioGroup>

                <p className="text-xs text-muted-foreground">
                  {imageMode === "single"
                    ? "A single image fills the hero area. Use high-quality landscape images (1920×600 px recommended)."
                    : "2–10 images rotate automatically every 5 seconds. Visitors can navigate using the dots. Same size recommendations apply."}
                </p>

                <ImageListField
                  label={
                    imageMode === "single" ? "Hero image" : "Slides (2–10)"
                  }
                  images={imageListFieldImages}
                  onChange={handleImageListFieldChange}
                  pendingFiles={pendingFilesMap}
                  onFileSelect={handleImageListFieldFileSelect}
                  minImages={1}
                  maxImages={imageMode === "single" ? 1 : 10}
                  showAltText
                />
              </TabsContent>

              {/* Video tab */}
              <TabsContent value="video" className="mt-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Upload a short, looping background video (MP4 recommended,
                  max 100 MB). Keep it under 30 seconds — it loops silently.{" "}
                  <strong>A poster image is required</strong>: it displays
                  before the video loads and prevents layout shift on slow
                  connections.
                </p>

                {/* Video file input */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Video file</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={
                        videoFile?.name ??
                        (savedVideoUrl ? "Current video" : "")
                      }
                      placeholder="No video selected"
                      className="flex-1 text-sm"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label className="cursor-pointer">
                        Upload
                        <input
                          type="file"
                          accept="video/*"
                          className="sr-only"
                          onChange={handleVideoFileSelect}
                        />
                      </label>
                    </Button>
                  </div>
                </div>

                {/* Poster image */}
                <ImageField
                  label="Poster image"
                  required
                  value={savedSettings?.homepageHeroVideoPosterUrl ?? ""}
                  pendingFile={pendingPosterFile}
                  previewUrl={posterPreviewUrl}
                  onFileSelect={handlePosterFileSelect}
                  placeholder="No poster selected"
                />
              </TabsContent>
            </Tabs>

            {/* Shared: heading + tagline */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Heading</Label>
                <Input
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="Leave blank to use store name"
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground">
                  Large text overlaid on the hero. Defaults to your store name.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tagline</Label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Small-batch specialty coffee"
                  maxLength={200}
                />
              </div>
            </div>
          </div>

          {/* ── Preview panel (60%) ── */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Preview</p>
            <div className="overflow-hidden rounded-lg border">
              <Hero
                heading={heading || "Your Store"}
                tagline={tagline || undefined}
                type={previewType}
                slides={previewSlides}
                imageUrl={
                  previewType === "image"
                    ? previewSlides[0]?.url
                    : undefined
                }
                imageAlt="Hero preview"
                videoUrl={previewVideoUrl || undefined}
                videoPosterUrl={previewPosterUrl || undefined}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Updates live as you make changes
            </p>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
