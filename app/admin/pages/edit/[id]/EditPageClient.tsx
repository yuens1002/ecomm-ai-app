"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import TipTapEditor from "@/components/app-components/TipTapEditor";
import { NameSlugField } from "@/components/app-components/NameSlugField";
import {
  DynamicIcon,
  COMMON_PAGE_ICONS,
} from "@/components/app-components/DynamicIcon";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaveButton } from "@/components/admin/SaveButton";

interface EditPageClientProps {
  page: {
    id: string;
    title: string;
    slug: string;
    heroImage: string | null;
    content: string;
    metaDescription: string | null;
    showInFooter: boolean;
    footerOrder: number | null;
    icon: string | null;
    isPublished: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generationPrompt: any;
    generatedBy: string | null;
  };
}

export default function EditPageClient({ page }: EditPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: page.title,
    slug: page.slug,
    heroImage: page.heroImage || "",
    content: page.content,
    metaDescription: page.metaDescription || "",
    showInFooter: page.showInFooter,
    footerOrder: page.footerOrder || 0,
    icon: page.icon || "",
    isPublished: page.isPublished,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update page");
      }

      toast({
        title: "Success",
        description: "Page updated successfully",
      });

      router.push("/admin/pages");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update page",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this page? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete page");
      }

      toast({
        title: "Success",
        description: "Page deleted successfully",
      });

      router.push("/admin/pages");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete page",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Page</h1>
            <p className="text-muted-foreground">{page.title}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Title + Slug */}
            <NameSlugField
              id="title"
              label="Title"
              name={formData.title}
              slug={formData.slug}
              editableSlug={false}
              onChange={({ name, slug }) =>
                setFormData((prev) => ({ ...prev, title: name, slug }))
              }
            />

            {/* Hero Image */}
            <div className="space-y-2">
              <Label htmlFor="heroImage">Hero Image (Optional)</Label>
              <Input
                id="heroImage"
                type="text"
                value={formData.heroImage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    heroImage: e.target.value,
                  }))
                }
                placeholder="https://example.com/image.jpg or /images/..."
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL or upload via /admin/settings
              </p>
            </div>

            {/* AI-Generated Content Info */}
            {page.generatedBy === "ai" && page.generationPrompt && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <h3 className="font-semibold text-sm">
                  AI-Generated Page Structure
                </h3>
                <p className="text-xs text-muted-foreground">
                  This page was generated with additional components (stats
                  cards and pull quote). To edit these, regenerate the page
                  using the wizard.
                </p>
                {typeof page.generationPrompt === "object" &&
                  page.generationPrompt !== null &&
                  "stats" in page.generationPrompt &&
                  Array.isArray(page.generationPrompt.stats) &&
                  page.generationPrompt.stats.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2">Stats Cards:</p>
                      <div className="text-xs space-y-1">
                        {page.generationPrompt.stats.map(
                          (
                            stat: { value: string; label: string },
                            i: number
                          ) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-semibold">
                                {stat.value}
                              </span>
                              <span className="text-muted-foreground">
                                {stat.label}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                {typeof page.generationPrompt === "object" &&
                  page.generationPrompt !== null &&
                  "pullQuote" in page.generationPrompt &&
                  typeof page.generationPrompt.pullQuote === "string" && (
                    <div>
                      <p className="text-xs font-medium mb-1">Pull Quote:</p>
                      <p className="text-xs italic text-muted-foreground">
                        &ldquo;{page.generationPrompt.pullQuote}&rdquo;
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <TipTapEditor
                content={formData.content}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, content: html }))
                }
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Meta Description */}
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    metaDescription: e.target.value,
                  }))
                }
                placeholder="Brief description for SEO..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>

            {/* Publishing */}
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="font-semibold">Publishing</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      isPublished: checked === true,
                    }))
                  }
                />
                <Label htmlFor="isPublished" className="cursor-pointer">
                  Publish page
                </Label>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="font-semibold">Footer Navigation</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showInFooter"
                  checked={formData.showInFooter}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      showInFooter: checked === true,
                    }))
                  }
                />
                <Label htmlFor="showInFooter" className="cursor-pointer">
                  Show in footer
                </Label>
              </div>
              {formData.showInFooter && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, icon: value }))
                      }
                    >
                      <SelectTrigger id="icon">
                        <SelectValue placeholder="Select an icon">
                          {formData.icon && (
                            <div className="flex items-center gap-2">
                              <DynamicIcon name={formData.icon} size={16} />
                              <span>{formData.icon}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_PAGE_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              <DynamicIcon name={icon} size={16} />
                              <span>{icon}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footerOrder">Display Order</Label>
                    <Input
                      id="footerOrder"
                      type="number"
                      value={formData.footerOrder}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          footerOrder: parseInt(e.target.value) || 0,
                        }))
                      }
                      min={0}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <SaveButton
                type="submit"
                className="w-full"
                isSaving={isSaving}
                label="Save Changes"
                savingLabel="Saving..."
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/admin/pages">Cancel</Link>
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete Page"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
