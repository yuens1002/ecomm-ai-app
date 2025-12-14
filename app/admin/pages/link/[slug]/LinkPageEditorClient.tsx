"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";

interface LinkPageEditorClientProps {
  page: {
    id: string;
    slug: string;
    title: string;
    url: string | null;
    icon: string | null;
    showInHeader: boolean;
    headerOrder: number | null;
    showInFooter: boolean;
    footerOrder: number | null;
    isPublished: boolean;
    metaDescription: string | null;
  };
}

export default function LinkPageEditorClient({
  page,
}: LinkPageEditorClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState(page.title);
  const [url, setUrl] = useState(page.url || "");
  const [icon, setIcon] = useState(page.icon || "");
  const [showInHeader, setShowInHeader] = useState(page.showInHeader);
  const [headerOrder, setHeaderOrder] = useState<number>(page.headerOrder || 0);
  const [showInFooter, setShowInFooter] = useState(page.showInFooter);
  const [footerOrder, setFooterOrder] = useState<number>(page.footerOrder || 0);
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [metaDescription, setMetaDescription] = useState(
    page.metaDescription || ""
  );

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/by-slug?slug=${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          icon: icon || null,
          showInHeader,
          headerOrder: showInHeader ? headerOrder : null,
          showInFooter,
          footerOrder: showInFooter ? footerOrder : null,
          isPublished,
          metaDescription,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast({
        title: "Success",
        description: "Link page settings saved successfully",
      });

      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/pages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{page.title}</h1>
            <p className="text-muted-foreground mt-2">Navigation Link</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Settings Panel */}
      <div className="space-y-6 bg-card border rounded-lg p-6">
        <FieldSet>
          <FieldLegend>Link Settings</FieldLegend>
          <FieldDescription>
            Configure the navigation link details
          </FieldDescription>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Link title"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="url">Destination URL</FieldLabel>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/about or https://example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Internal paths start with / (e.g., /about, /contact)
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="icon">Icon (optional)</FieldLabel>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g., Sparkles, Mail, Phone"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lucide icon name for navigation display
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="metaDescription">
                Meta Description
              </FieldLabel>
              <Input
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Brief description for SEO"
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Navigation Display</FieldLegend>
          <FieldDescription>
            Choose where this link appears in site navigation
          </FieldDescription>

          <FieldGroup>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Show in Header</p>
                <p className="text-sm text-muted-foreground">
                  Display in main navigation
                </p>
              </div>
              <Switch
                checked={showInHeader}
                onCheckedChange={setShowInHeader}
              />
            </div>

            {showInHeader && (
              <Field>
                <FieldLabel htmlFor="headerOrder">Header Order</FieldLabel>
                <Input
                  id="headerOrder"
                  type="number"
                  value={headerOrder}
                  onChange={(e) =>
                    setHeaderOrder(parseInt(e.target.value) || 0)
                  }
                  className="w-24"
                />
              </Field>
            )}

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Show in Footer</p>
                <p className="text-sm text-muted-foreground">
                  Display in footer links
                </p>
              </div>
              <Switch
                checked={showInFooter}
                onCheckedChange={setShowInFooter}
              />
            </div>

            {showInFooter && (
              <Field>
                <FieldLabel htmlFor="footerOrder">Footer Order</FieldLabel>
                <Input
                  id="footerOrder"
                  type="number"
                  value={footerOrder}
                  onChange={(e) =>
                    setFooterOrder(parseInt(e.target.value) || 0)
                  }
                  className="w-24"
                />
              </Field>
            )}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Publishing</FieldLegend>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Published</p>
              <p className="text-sm text-muted-foreground">
                Make this link visible in navigation
              </p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </FieldSet>
      </div>
    </>
  );
}
