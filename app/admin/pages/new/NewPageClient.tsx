"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import TipTapEditor from "@/app/admin/_components/cms/editors/TipTapEditor";
import { NameSlugField } from "@/app/admin/_components/cms/fields/NameSlugField";
import { useToast } from "@/hooks/use-toast";
import { SaveButton } from "@/app/admin/_components/forms/SaveButton";

export default function NewPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    heroImage: "",
    content: "",
    metaDescription: "",
    showInFooter: false,
    footerOrder: 0,
    isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create page");
      }

      toast({
        title: "Success",
        description: "Page created successfully",
      });

      router.push("/admin/pages");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create page",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Slug is derived via NameSlugField; no separate handler needed.

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
            <h1 className="text-3xl font-bold">New Page</h1>
            <p className="text-muted-foreground">
              Create a new informational page
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/pages/new/wizard">
            <Sparkles className="mr-2 h-4 w-4" />
            Use AI Wizard
          </Link>
        </Button>
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
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <SaveButton
                type="submit"
                className="w-full"
                isSaving={isSaving}
                label="Create Page"
                savingLabel="Creating..."
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/admin/pages">Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
