"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ImageField } from "@/app/admin/_components/cms/fields/ImageField";
import { ImageListField } from "@/app/admin/_components/cms/fields/ImageListField";
import {
  useImageUpload,
  useMultiImageUpload,
} from "@/app/admin/_hooks/useImageUpload";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { OptionCardGroup } from "@/app/admin/_components/forms/OptionCardGroup";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImageIcon, Loader2, Save, Trash2, Upload } from "lucide-react";
import { Hero } from "@/app/(site)/_components/content/Hero";
import { useToast } from "@/hooks/use-toast";
import { IS_DEMO } from "@/lib/demo";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/lib/site-settings";

type HeroType = "image" | "carousel" | "video";
type ImageMode = "single" | "slideshow";
type MediaType = "image-slides" | "video";

interface HeroSettings {
  homepageHeroEnabled: boolean;
  homepageHeroType: HeroType;
  homepageHeroSlides: HeroSlide[];
  homepageHeroVideoUrl: string;
  homepageHeroVideoPosterUrl: string;
  homepageHeroHeading: string;
  homepageHeroTagline: string;
}

const MEDIA_OPTIONS = [
  {
    value: "image-slides" as MediaType,
    title: "Image or Slideshow",
    description:
      "Upload 1 image for a static hero or 2–10 for a rotating slideshow. Mode is detected automatically.",
  },
  {
    value: "video" as MediaType,
    title: "Video",
    description:
      "A short looping background video (MP4, max 100 MB). A poster image is required.",
  },
];

export function HeroSettingsSection() {
  const { toast } = useToast();

  // Server state
  const [savedSettings, setSavedSettings] = useState<HeroSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // UI state
  const [heroEnabled, setHeroEnabled] = useState(true);
  // mediaType drives both the editing panel and heroType on save
  const [mediaType, setMediaType] = useState<MediaType>("image-slides");
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
    minImages: 0,
    maxImages: 10,
  });

  // Poster image (deferred upload)
  const {
    pendingFile: pendingPosterFile,
    previewUrl: posterPreviewUrl,
    displayUrl: posterDisplayUrl,
    handleFileSelect: handlePosterFileSelect,
    uploadFile: uploadPosterFile,
    reset: resetPosterFile,
  } = useImageUpload({
    currentUrl: savedSettings?.homepageHeroVideoPosterUrl ?? "",
  });

  // Load settings on mount
  useEffect(() => {
    fetch("/api/admin/settings/hero-media")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        return res.json() as Promise<HeroSettings>;
      })
      .then((data) => {
        setSavedSettings(data);
        setHeroEnabled(data.homepageHeroEnabled);
        setHeading(data.homepageHeroHeading);
        setTagline(data.homepageHeroTagline);
        setSavedVideoUrl(data.homepageHeroVideoUrl);
        setMediaType(data.homepageHeroType === "video" ? "video" : "image-slides");
        setImageMode(data.homepageHeroType === "carousel" ? "slideshow" : "single");
      })
      .catch(() => {
        toast({ title: "Failed to load hero settings", variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, [toast]);

  // Auto-switch single ↔ slideshow based on image count
  useEffect(() => {
    if (isLoading) return;
    setImageMode(imageListFieldImages.length > 1 ? "slideshow" : "single");
  }, [imageListFieldImages.length, isLoading]);

  const handleVideoFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("video/")) {
        toast({ title: "File must be a video", variant: "destructive" });
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast({ title: "Video must be under 100 MB", variant: "destructive" });
        return;
      }

      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    },
    [videoPreviewUrl, toast]
  );

  const handleSave = useCallback(async () => {
    if (IS_DEMO) {
      toast({ title: "Changes are disabled in demo mode.", variant: "demo" });
      return;
    }
    if (mediaType === "video" && !videoFile && !savedVideoUrl) {
      toast({ title: "A video file is required", variant: "destructive" });
      return;
    }
    if (mediaType === "video" && !pendingPosterFile && !savedSettings?.homepageHeroVideoPosterUrl) {
      toast({ title: "A poster image is required for video hero", variant: "destructive" });
      return;
    }
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

      // 4. Determine hero type: mediaType drives the top-level choice;
      //    image count auto-selects carousel vs single image.
      const heroType: HeroType =
        mediaType === "video"
          ? "video"
          : imageMode === "slideshow"
            ? "carousel"
            : "image";

      // 5. Save settings to DB
      const res = await fetch("/api/admin/settings/hero-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homepageHeroEnabled: heroEnabled,
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
    heroEnabled,
    mediaType,
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

  /** Delete the saved video from blob and clear it from DB immediately. */
  const handleDeleteVideo = useCallback(async () => {
    if (IS_DEMO) {
      toast({ title: "Changes are disabled in demo mode.", variant: "demo" });
      return;
    }

    if (videoFile && !savedVideoUrl) {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      return;
    }

    setIsSaving(true);
    try {
      if (savedVideoUrl) {
        const res = await fetch(
          `/api/upload/video?path=${encodeURIComponent(savedVideoUrl)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to delete video");
      }

      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setSavedVideoUrl("");

      const putRes = await fetch("/api/admin/settings/hero-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homepageHeroEnabled: heroEnabled,
          homepageHeroType: imageMode === "slideshow" ? "carousel" : "image",
          homepageHeroSlides: savedSettings?.homepageHeroSlides ?? [],
          homepageHeroVideoUrl: "",
          homepageHeroVideoPosterUrl: savedSettings?.homepageHeroVideoPosterUrl ?? "",
          homepageHeroHeading: heading,
          homepageHeroTagline: tagline,
        }),
      });
      if (!putRes.ok) throw new Error("Failed to update settings");
      setSavedSettings((await putRes.json()) as HeroSettings);

      toast({ title: "Video removed" });
    } catch {
      toast({ title: "Failed to remove video", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [heroEnabled, imageMode, videoFile, videoPreviewUrl, savedVideoUrl, savedSettings, heading, tagline, toast]);

  /** Delete the saved poster from blob and clear it from DB immediately. */
  const handleClearPoster = useCallback(async () => {
    if (IS_DEMO) {
      toast({ title: "Changes are disabled in demo mode.", variant: "demo" });
      return;
    }

    if (pendingPosterFile) {
      resetPosterFile();
      return;
    }

    const posterUrl = savedSettings?.homepageHeroVideoPosterUrl;
    if (!posterUrl) return;

    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/upload?path=${encodeURIComponent(posterUrl)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete poster");

      const putRes = await fetch("/api/admin/settings/hero-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homepageHeroEnabled: heroEnabled,
          homepageHeroType: "video",
          homepageHeroSlides: savedSettings?.homepageHeroSlides ?? [],
          homepageHeroVideoUrl: savedVideoUrl,
          homepageHeroVideoPosterUrl: "",
          homepageHeroHeading: heading,
          homepageHeroTagline: tagline,
        }),
      });
      if (!putRes.ok) throw new Error("Failed to update settings");
      setSavedSettings((await putRes.json()) as HeroSettings);

      toast({ title: "Poster image removed" });
    } catch {
      toast({ title: "Failed to remove poster image", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [heroEnabled, pendingPosterFile, savedSettings, savedVideoUrl, heading, tagline, resetPosterFile, toast]);

  // Derive preview values from current form state
  const previewType: HeroType =
    mediaType === "video"
      ? "video"
      : imageMode === "slideshow"
        ? "carousel"
        : "image";

  const previewSlides = imageListFieldImages.filter((img) => img.url);
  const previewVideoUrl = videoPreviewUrl ?? savedVideoUrl;
  const previewPosterUrl = posterPreviewUrl ?? posterDisplayUrl;

  const hasVideo = !!(videoFile || savedVideoUrl);

  const isDirty = useMemo(() => {
    if (!savedSettings || isLoading) return false;
    const savedMediaType = savedSettings.homepageHeroType === "video" ? "video" : "image-slides";
    return (
      heroEnabled !== savedSettings.homepageHeroEnabled ||
      mediaType !== savedMediaType ||
      heading !== savedSettings.homepageHeroHeading ||
      tagline !== savedSettings.homepageHeroTagline ||
      videoFile !== null ||
      pendingPosterFile !== null ||
      pendingFilesMap.size > 0 ||
      imageListFieldImages.length !== savedSettings.homepageHeroSlides.length
    );
  }, [
    savedSettings,
    isLoading,
    heroEnabled,
    mediaType,
    heading,
    tagline,
    videoFile,
    pendingPosterFile,
    pendingFilesMap,
    imageListFieldImages.length,
  ]);

  return (
    <SettingsSection
      icon={<ImageIcon className="h-5 w-5" />}
      title="Homepage Hero"
      description="Choose a media type to display at the top of your homepage. The selected type is what visitors see."
      action={
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || isLoading || !isDirty}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-2">{isSaving ? "Saving" : "Save"}</span>
          <span
            className={cn(
              "ml-2 size-2 rounded-full",
              isDirty ? "bg-amber-400" : "bg-green-400"
            )}
          />
        </Button>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_3fr]">
          {/* ── Form panel ── */}
          <div className="space-y-6">

            {/* Enable / disable toggle */}
            <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Show hero on homepage</p>
                <p className="text-xs text-muted-foreground">
                  When off, the hero section is hidden for all visitors.
                </p>
              </div>
              <Switch
                checked={heroEnabled}
                onCheckedChange={setHeroEnabled}
              />
            </div>

            {/* Media type selector */}
            <OptionCardGroup
              value={mediaType}
              onValueChange={(v) => setMediaType(v as MediaType)}
              options={MEDIA_OPTIONS}
              wrapperClassName="w-full"
            />

            {/* Image / Slideshow editing UI */}
            {mediaType === "image-slides" && (
              <div className="space-y-4">
                <ImageListField
                  label={imageMode === "single" ? "Hero image" : "Slides (2–10)"}
                  images={imageListFieldImages}
                  onChange={handleImageListFieldChange}
                  pendingFiles={pendingFilesMap}
                  onFileSelect={handleImageListFieldFileSelect}
                  minImages={0}
                  maxImages={10}
                  showAltText={false}
                />
              </div>
            )}

            {/* Video editing UI */}
            {mediaType === "video" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  The video is displayed at full viewport width. For best results, use a <strong>3:1 aspect ratio</strong> (e.g. 1920&times;640). Taller videos will be letterboxed with black bars.
                </p>
                {/* Video file input */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Video file <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={
                        videoFile?.name ??
                        (savedVideoUrl
                          ? decodeURIComponent(savedVideoUrl.split("/").pop() ?? "")
                          : "")
                      }
                      placeholder="No video selected"
                      className="flex-1 text-sm"
                    />
                    <Button variant="outline" size="icon" asChild>
                      <label className="cursor-pointer" title="Upload video">
                        <Upload className="h-4 w-4" />
                        <input
                          type="file"
                          accept="video/*"
                          className="sr-only"
                          onChange={handleVideoFileSelect}
                        />
                      </label>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      title="Remove video"
                      disabled={!hasVideo || isSaving}
                      onClick={handleDeleteVideo}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
                  onClear={handleClearPoster}
                  placeholder="No poster selected"
                />
              </div>
            )}

            {/* Heading + tagline — image/slideshow only */}
            {mediaType === "image-slides" && <div className="space-y-4 border-t pt-4">
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
            </div>}
          </div>

          {/* ── Preview panel ── */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Preview</p>
            <div className="overflow-hidden rounded-lg border">
              <Hero
                heading={heading || undefined}
                tagline={tagline || undefined}
                type={previewType}
                slides={previewSlides}
                imageUrl={previewType === "image" ? previewSlides[0]?.url : undefined}
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
