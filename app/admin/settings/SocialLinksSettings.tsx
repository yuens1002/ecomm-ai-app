"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
} from "lucide-react";
import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field";
import { ButtonGroup } from "@/components/ui/button-group";
import FileUpload from "@/components/app-components/FileUpload";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "lucide-react";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  customIconUrl?: string | null;
  useCustomIcon: boolean;
  order: number;
  isActive: boolean;
}

// Popular social platforms with their default Lucide icon names
const SOCIAL_PLATFORMS = [
  { name: "Facebook", icon: "Facebook" },
  { name: "Twitter/X", icon: "Twitter" },
  { name: "Instagram", icon: "Instagram" },
  { name: "LinkedIn", icon: "Linkedin" },
  { name: "YouTube", icon: "Youtube" },
  { name: "TikTok", icon: "Music" },
  { name: "Pinterest", icon: "Pin" },
  { name: "GitHub", icon: "Github" },
  { name: "Discord", icon: "MessageCircle" },
  { name: "Twitch", icon: "Tv" },
  { name: "Custom", icon: "Link" },
];

const MAX_LINKS = 5;

interface SocialLinksFeatureSettings {
  enabled: boolean;
  heading: string;
  description: string;
}

export default function SocialLinksSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [savingLinks, setSavingLinks] = useState<Record<string, boolean>>({});
  const [savingFeature, setSavingFeature] = useState(false);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [originalLinks, setOriginalLinks] = useState<SocialLink[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Feature settings
  const [featureSettings, setFeatureSettings] =
    useState<SocialLinksFeatureSettings>({
      enabled: false,
      heading: "Stay Connected",
      description: "",
    });
  const [originalFeatureSettings, setOriginalFeatureSettings] =
    useState<SocialLinksFeatureSettings>({
      enabled: false,
      heading: "Stay Connected",
      description: "",
    });

  // Separate tracking for system vs custom platform names and URLs
  const [systemPlatforms, setSystemPlatforms] = useState<
    Record<string, string>
  >({});
  const [customPlatforms, setCustomPlatforms] = useState<
    Record<string, string>
  >({});
  const [systemUrls, setSystemUrls] = useState<Record<string, string>>({});
  const [customUrls, setCustomUrls] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const [linksResponse, featureResponse] = await Promise.all([
        fetch("/api/admin/settings/social-links"),
        fetch("/api/admin/settings/social-links-feature"),
      ]);

      if (!linksResponse.ok) throw new Error("Failed to fetch social links");
      if (!featureResponse.ok)
        throw new Error("Failed to fetch feature settings");

      const linksData = await linksResponse.json();
      const featureData = await featureResponse.json();

      setLinks(linksData);
      setOriginalLinks(JSON.parse(JSON.stringify(linksData))); // Deep copy

      setFeatureSettings(featureData);
      setOriginalFeatureSettings(JSON.parse(JSON.stringify(featureData))); // Deep copy

      // Initialize separate platform name and URL tracking
      const systemPlatformsMap: Record<string, string> = {};
      const customPlatformsMap: Record<string, string> = {};
      const systemUrlsMap: Record<string, string> = {};
      const customUrlsMap: Record<string, string> = {};

      linksData.forEach((link: SocialLink) => {
        if (link.useCustomIcon) {
          customPlatformsMap[link.id] = link.platform;
          customUrlsMap[link.id] = link.url;
        } else {
          systemPlatformsMap[link.id] = link.platform;
          systemUrlsMap[link.id] = link.url;
        }
      });

      setSystemPlatforms(systemPlatformsMap);
      setCustomPlatforms(customPlatformsMap);
      setSystemUrls(systemUrlsMap);
      setCustomUrls(customUrlsMap);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (linkId: string) => {
    const link = links.find((l) => l.id === linkId);
    if (!link) return;

    // Validate required fields
    if (!link.url.trim() || !link.platform.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in platform and URL",
        variant: "destructive",
      });
      return;
    }

    setSavingLinks({ ...savingLinks, [linkId]: true });
    try {
      // If any link order has changed, save all links to preserve ordering
      const orderChanged = links.some((l) => {
        const original = originalLinks.find((o) => o.id === l.id);
        return original && original.order !== l.order;
      });

      const linksToSave = orderChanged ? links : [link];

      const response = await fetch("/api/admin/settings/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: linksToSave }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save social link");
      }

      toast({
        title: "Success",
        description: "Social link saved successfully",
      });

      // Update original state to match current state (mark as saved)
      setOriginalLinks(JSON.parse(JSON.stringify(links)));
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save social link",
        variant: "destructive",
      });
    } finally {
      setSavingLinks({ ...savingLinks, [linkId]: false });
    }
  };

  const handleSaveFeatureSettings = async () => {
    setSavingFeature(true);
    try {
      const response = await fetch("/api/admin/settings/social-links-feature", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureSettings),
      });

      if (!response.ok) throw new Error("Failed to save feature settings");

      toast({
        title: "Success",
        description: "Social links feature settings saved",
      });

      setOriginalFeatureSettings(JSON.parse(JSON.stringify(featureSettings)));
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSavingFeature(false);
    }
  };

  const addLink = () => {
    if (links.length >= MAX_LINKS) {
      toast({
        title: "Maximum reached",
        description: `You can only add up to ${MAX_LINKS} social links`,
        variant: "destructive",
      });
      return;
    }

    const newId = `temp-${Date.now()}`;
    const newLink: SocialLink = {
      id: newId,
      platform: "",
      url: "",
      icon: "Link",
      customIconUrl: null,
      useCustomIcon: false,
      order: links.length,
      isActive: true,
    };
    setLinks([...links, newLink]);

    // Initialize empty platform names and URLs for new link
    setSystemPlatforms({ ...systemPlatforms, [newId]: "" });
    setCustomPlatforms({ ...customPlatforms, [newId]: "" });
    setSystemUrls({ ...systemUrls, [newId]: "" });
    setCustomUrls({ ...customUrls, [newId]: "" });
  };

  const removeLink = (id: string) => {
    // Check if link has been modified
    const link = links.find((l) => l.id === id);
    const originalLink = originalLinks.find((l) => l.id === id);

    const isDirty =
      link &&
      originalLink &&
      (link.platform !== originalLink.platform ||
        link.url !== originalLink.url ||
        link.icon !== originalLink.icon ||
        link.isActive !== originalLink.isActive);

    // If it's a new link (temp id) or not dirty, delete immediately
    if (id.startsWith("temp-") || !isDirty) {
      setLinks(links.filter((link) => link.id !== id));
    } else {
      // Show confirmation dialog for dirty existing links
      setDeleteConfirmId(id);
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setLinks(links.filter((link) => link.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const updateLink = (id: string, updates: Partial<SocialLink>) => {
    setLinks(
      links.map((link) => (link.id === id ? { ...link, ...updates } : link))
    );
  };

  const moveLink = (index: number, direction: "up" | "down") => {
    const newLinks = [...links];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newLinks.length) return;

    [newLinks[index], newLinks[newIndex]] = [
      newLinks[newIndex],
      newLinks[index],
    ];

    // Update order values
    newLinks.forEach((link, idx) => {
      link.order = idx;
    });

    setLinks(newLinks);
  };

  const selectPlatform = (id: string, platformName: string) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.name === platformName);
    if (platform) {
      // Update system platform name tracking
      setSystemPlatforms({ ...systemPlatforms, [id]: platformName });

      updateLink(id, {
        platform: platformName,
        icon: platform.icon,
      });
    }
  };

  const updateCustomPlatformName = (id: string, platformName: string) => {
    // Update custom platform name tracking
    setCustomPlatforms({ ...customPlatforms, [id]: platformName });

    updateLink(id, {
      platform: platformName,
    });
  };

  const updateSystemUrl = (id: string, url: string) => {
    // Update system URL tracking
    setSystemUrls({ ...systemUrls, [id]: url });

    updateLink(id, {
      url: url,
    });
  };

  const updateCustomUrl = (id: string, url: string) => {
    // Update custom URL tracking
    setCustomUrls({ ...customUrls, [id]: url });

    updateLink(id, {
      url: url,
    });
  };

  // Check if a link is dirty (modified)
  const isLinkDirty = (linkId: string) => {
    if (linkId.startsWith("temp-")) return true; // New links are always dirty

    const link = links.find((l) => l.id === linkId);
    const originalLink = originalLinks.find((l) => l.id === linkId);

    if (!link || !originalLink) return false;

    return (
      link.platform !== originalLink.platform ||
      link.url !== originalLink.url ||
      link.icon !== originalLink.icon ||
      link.customIconUrl !== originalLink.customIconUrl ||
      link.useCustomIcon !== originalLink.useCustomIcon ||
      link.order !== originalLink.order ||
      link.isActive !== originalLink.isActive
    );
  };

  // Check if feature settings are dirty
  const isFeatureHeadingDirty =
    featureSettings.heading !== originalFeatureSettings.heading;
  const isFeatureDescriptionDirty =
    featureSettings.description !== originalFeatureSettings.description;

  // Render icon preview with case-insensitive matching
  const renderIcon = (iconName: string) => {
    // Try exact match first
    let IconComponent = icons[iconName as keyof typeof icons] as LucideIcon;

    // If not found, try case-insensitive match
    if (!IconComponent) {
      const iconKey = Object.keys(icons).find(
        (key) => key.toLowerCase() === iconName.toLowerCase()
      );
      if (iconKey) {
        IconComponent = icons[iconKey as keyof typeof icons] as LucideIcon;
      }
    }

    // Fallback to Link icon
    if (!IconComponent) {
      IconComponent = icons.Link as LucideIcon;
    }

    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Modified Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This social link has unsaved changes. Are you sure you want to
              delete it? Any modifications will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="pb-8">
          <div className="flex items-start justify-between gap-4">
            <Field orientation="vertical">
              <FieldContent>
                <FieldTitle className="text-base font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Social Media Links
                </FieldTitle>
                <FieldDescription>
                  Manage social media links displayed in the footer
                </FieldDescription>
              </FieldContent>
            </Field>
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <Label
                htmlFor="social-links-enabled"
                className="text-xs text-muted-foreground w-14 text-right"
              >
                {featureSettings.enabled ? "Active" : "Inactive"}
              </Label>
              <Switch
                id="social-links-enabled"
                checked={featureSettings.enabled}
                onCheckedChange={async (checked) => {
                  const newSettings = {
                    ...featureSettings,
                    enabled: checked,
                  };
                  setFeatureSettings(newSettings);
                  setSavingFeature(true);

                  try {
                    const response = await fetch(
                      "/api/admin/settings/social-links-feature",
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newSettings),
                      }
                    );

                    if (!response.ok)
                      throw new Error("Failed to save feature settings");

                    setOriginalFeatureSettings(newSettings);
                  } catch (error) {
                    toast({
                      title: "Error",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to save settings",
                      variant: "destructive",
                    });
                    // Revert on error
                    setFeatureSettings(featureSettings);
                  } finally {
                    setSavingFeature(false);
                  }
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feature Settings: Heading & Description */}
          <FieldGroup>
            <Field>
              <FormHeading
                htmlFor="social-links-heading"
                label="Heading"
                isDirty={isFeatureHeadingDirty}
              />
              <Input
                id="social-links-heading"
                value={featureSettings.heading}
                onChange={(e) =>
                  setFeatureSettings({
                    ...featureSettings,
                    heading: e.target.value,
                  })
                }
                placeholder={originalFeatureSettings.heading}
                className={isFeatureHeadingDirty ? "border-amber-500" : ""}
              />
            </Field>
            <Field>
              <FormHeading
                htmlFor="social-links-description"
                label="Description (Optional)"
                isDirty={isFeatureDescriptionDirty}
              />
              <Textarea
                id="social-links-description"
                value={featureSettings.description}
                onChange={(e) =>
                  setFeatureSettings({
                    ...featureSettings,
                    description: e.target.value,
                  })
                }
                rows={3}
                placeholder="Add an optional description for the social links section"
                className={isFeatureDescriptionDirty ? "border-amber-500" : ""}
              />
            </Field>

            <div className="flex items-center justify-end pt-2">
              <Button
                size="sm"
                onClick={handleSaveFeatureSettings}
                disabled={savingFeature}
                className="shrink-0"
              >
                {savingFeature ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Saving</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="ml-2">Save</span>
                  </>
                )}
              </Button>
            </div>
          </FieldGroup>

          <div className="border-t pt-6 mt-6" />

          {/* Links Management */}
          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Button
                onClick={addLink}
                size="sm"
                disabled={links.length >= MAX_LINKS}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Link {links.length > 0 && `(${links.length}/${MAX_LINKS})`}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                No social links added yet. Click &quot;Add Link&quot; to get
                started.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Manage Links</h3>
                <Button
                  onClick={addLink}
                  size="sm"
                  disabled={links.length >= MAX_LINKS}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link{" "}
                  {links.length > 0 && `(${links.length}/${MAX_LINKS})`}
                </Button>
              </div>
              <div className="space-y-4">
                {links.map((link, index) => {
                  const isDirty = isLinkDirty(link.id);
                  return (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 rounded-lg"
                    >
                      <div className="flex-1 space-y-4">
                        {/* Header row with title, actions, and unsaved changes */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-medium">
                              Social Link ({index + 1}/{links.length})
                            </h3>
                            <Label
                              htmlFor={`active-${link.id}`}
                              className="text-xs text-muted-foreground w-14"
                            >
                              {link.isActive ? "Active" : "Inactive"}
                            </Label>
                            <Switch
                              id={`active-${link.id}`}
                              checked={link.isActive}
                              onCheckedChange={(checked) =>
                                updateLink(link.id, { isActive: checked })
                              }
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeLink(link.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-3">
                            {isDirty && (
                              <span className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Unsaved changes
                              </span>
                            )}
                            <Button
                              onClick={() => handleSave(link.id)}
                              disabled={savingLinks[link.id] || !isDirty}
                              variant="outline"
                              size="sm"
                            >
                              {savingLinks[link.id] ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Platform Type Radio Group */}
                        <div className="space-y-8">
                          <Label className="hidden">
                            Toggle between system or custom social icon link
                          </Label>
                          <RadioGroup
                            value={link.useCustomIcon ? "custom" : "system"}
                            onValueChange={(value) => {
                              const isCustom = value === "custom";

                              // Use the stored platform name and URL for the selected mode
                              const platformName = isCustom
                                ? customPlatforms[link.id] || ""
                                : systemPlatforms[link.id] || "";
                              const url = isCustom
                                ? customUrls[link.id] || ""
                                : systemUrls[link.id] || "";

                              updateLink(link.id, {
                                useCustomIcon: isCustom,
                                platform: platformName,
                                url: url,
                                // Don't set icon to "Link" if not custom, preserve existing icon
                                ...(!isCustom && { icon: link.icon }),
                              });
                            }}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6">
                              {/* System Platforms */}
                              <label
                                htmlFor={`system-${link.id}`}
                                className={`block p-6 rounded-lg transition-all cursor-pointer ${
                                  !link.useCustomIcon
                                    ? isDirty
                                      ? "border border-amber-500"
                                      : "border border-primary/30"
                                    : "border border-border/80"
                                }`}
                              >
                                <Field orientation="horizontal">
                                  <FieldContent>
                                    <FieldTitle>
                                      Social media platforms
                                    </FieldTitle>
                                    <FieldDescription>
                                      Choose a social media platform
                                    </FieldDescription>
                                  </FieldContent>
                                  <RadioGroupItem
                                    value="system"
                                    id={`system-${link.id}`}
                                  />
                                </Field>

                                {!link.useCustomIcon && (
                                  <div className="mt-6">
                                    <div className="flex items-center gap-3">
                                      <Label className="text-sm font-medium w-12 shrink-0">
                                        Link
                                      </Label>
                                      <ButtonGroup className="flex-1">
                                        <Select
                                          value={systemPlatforms[link.id] || ""}
                                          onValueChange={(value) =>
                                            selectPlatform(link.id, value)
                                          }
                                        >
                                          <SelectTrigger
                                            className="w-[140px]"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <SelectValue placeholder="Platform" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {SOCIAL_PLATFORMS.filter(
                                              (p) => p.name !== "Custom"
                                            ).map((platform) => (
                                              <SelectItem
                                                key={platform.name}
                                                value={platform.name}
                                              >
                                                <div className="flex items-center gap-2">
                                                  {renderIcon(platform.icon)}
                                                  {platform.name}
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <InputGroup className="flex-1 min-w-0">
                                          <InputGroupInput
                                            id={`url-${link.id}`}
                                            type="text"
                                            value={systemUrls[link.id] || ""}
                                            onChange={(e) =>
                                              updateSystemUrl(
                                                link.id,
                                                e.target.value
                                              )
                                            }
                                            placeholder={
                                              systemPlatforms[link.id] ===
                                              "Facebook"
                                                ? "https://facebook.com/yourpage"
                                                : systemPlatforms[link.id] ===
                                                    "Twitter/X"
                                                  ? "https://x.com/yourhandle"
                                                  : systemPlatforms[link.id] ===
                                                      "Instagram"
                                                    ? "https://instagram.com/yourhandle"
                                                    : systemPlatforms[
                                                          link.id
                                                        ] === "LinkedIn"
                                                      ? "https://linkedin.com/company/yourcompany"
                                                      : systemPlatforms[
                                                            link.id
                                                          ] === "YouTube"
                                                        ? "https://youtube.com/@yourchannel"
                                                        : systemPlatforms[
                                                              link.id
                                                            ] === "TikTok"
                                                          ? "https://tiktok.com/@yourhandle"
                                                          : systemPlatforms[
                                                                link.id
                                                              ] === "Pinterest"
                                                            ? "https://pinterest.com/yourhandle"
                                                            : systemPlatforms[
                                                                  link.id
                                                                ] === "GitHub"
                                                              ? "https://github.com/yourusername"
                                                              : systemPlatforms[
                                                                    link.id
                                                                  ] ===
                                                                  "Discord"
                                                                ? "https://discord.gg/yourinvite"
                                                                : systemPlatforms[
                                                                      link.id
                                                                    ] ===
                                                                    "Twitch"
                                                                  ? "https://twitch.tv/yourchannel"
                                                                  : "Select a platform"
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </InputGroup>
                                      </ButtonGroup>
                                    </div>
                                  </div>
                                )}
                              </label>

                              {/* Move Up/Down Buttons - Between Options */}
                              <div className="hidden md:flex flex-col gap-1 justify-center self-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-accent"
                                  onClick={() => moveLink(index, "up")}
                                  disabled={index === 0}
                                  title="Move up"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-accent"
                                  onClick={() => moveLink(index, "down")}
                                  disabled={index === links.length - 1}
                                  title="Move down"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Custom Platform */}
                              <label
                                htmlFor={`custom-${link.id}`}
                                className={`block p-6 rounded-lg transition-all cursor-pointer ${
                                  link.useCustomIcon
                                    ? isDirty
                                      ? "border border-amber-500"
                                      : "border border-primary/30"
                                    : "border border-border/80"
                                }`}
                              >
                                <Field orientation="horizontal">
                                  <FieldContent>
                                    <FieldTitle>Custom</FieldTitle>
                                    <FieldDescription>
                                      Enter the name, link & icon URL
                                    </FieldDescription>
                                  </FieldContent>
                                  <RadioGroupItem
                                    value="custom"
                                    id={`custom-${link.id}`}
                                  />
                                </Field>

                                {link.useCustomIcon && (
                                  <div className="mt-6 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Label className="text-sm font-medium w-16 shrink-0">
                                        Name
                                      </Label>
                                      <InputGroup className="flex-1 min-w-0">
                                        <InputGroupInput
                                          type="text"
                                          value={customPlatforms[link.id] || ""}
                                          onChange={(e) =>
                                            updateCustomPlatformName(
                                              link.id,
                                              e.target.value
                                            )
                                          }
                                          placeholder="Platform name (e.g., Mastodon)"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </InputGroup>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <Label className="text-sm font-medium w-16 shrink-0">
                                        Link
                                      </Label>
                                      <InputGroup className="flex-1 min-w-0">
                                        <InputGroupInput
                                          type="text"
                                          value={customUrls[link.id] || ""}
                                          onChange={(e) =>
                                            updateCustomUrl(
                                              link.id,
                                              e.target.value
                                            )
                                          }
                                          placeholder="https://example.com/yourpage"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </InputGroup>
                                    </div>

                                    <FileUpload
                                      linkId={link.id}
                                      currentIconUrl={link.customIconUrl}
                                      onUploadComplete={(url) =>
                                        updateLink(link.id, {
                                          customIconUrl: url,
                                        })
                                      }
                                    />
                                  </div>
                                )}
                              </label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
