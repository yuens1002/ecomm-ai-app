"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopCategoriesMultiSelect } from "./TopCategoriesMultiSelect";
import { CuratedCategorySelect } from "./CuratedCategorySelect";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface SearchSettings {
  chipsHeading: string;
  chipCategories: string[];
  curatedCategory: string | null;
}

const HEADING_MAX = 60;

export function SearchSettingsForm({
  initialSettings,
  categories,
}: {
  initialSettings: SearchSettings;
  categories: CategoryOption[];
}) {
  const [chipsHeading, setChipsHeading] = useState(initialSettings.chipsHeading);
  const [chipCategorySlugs, setChipCategorySlugs] = useState<string[]>(
    initialSettings.chipCategories
  );
  const [curatedCategorySlug, setCuratedCategorySlug] = useState<string | null>(
    initialSettings.curatedCategory
  );
  const [saving, setSaving] = useState(false);
  const [headingError, setHeadingError] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset error when heading changes
  useEffect(() => {
    if (headingError && chipsHeading.trim().length > 0) {
      setHeadingError(null);
    }
  }, [chipsHeading, headingError]);

  async function handleSave() {
    const trimmedHeading = chipsHeading.trim();
    if (trimmedHeading.length === 0) {
      setHeadingError("Heading is required");
      return;
    }
    if (trimmedHeading.length > HEADING_MAX) {
      setHeadingError(`Heading must be ${HEADING_MAX} characters or fewer`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/search-drawer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chipsHeading: trimmedHeading,
          chipCategories: chipCategorySlugs,
          curatedCategory: curatedCategorySlug,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast({
          title: "Save failed",
          description: data.error || "Failed to save search settings",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Search settings saved",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Save failed",
        description: "Failed to save search settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* Field 1: Chips section heading */}
      <div className="space-y-3 max-w-[72ch]">
        <div className="space-y-1">
          <Label htmlFor="chips-heading" className="text-sm font-medium">
            Section heading
          </Label>
          <p className="text-sm text-muted-foreground">
            Shown above the chip row in the search drawer. Default: &ldquo;Top Categories&rdquo;.
          </p>
        </div>
        <Input
          id="chips-heading"
          value={chipsHeading}
          onChange={(e) => setChipsHeading(e.target.value)}
          maxLength={HEADING_MAX}
          aria-invalid={Boolean(headingError)}
          aria-describedby={headingError ? "chips-heading-error" : undefined}
        />
        {headingError && (
          <p id="chips-heading-error" className="text-sm text-destructive">
            {headingError}
          </p>
        )}
      </div>

      {/* Field 2: Top Categories multi-select */}
      <div className="space-y-3 max-w-[72ch]">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Top Categories</Label>
          <p className="text-sm text-muted-foreground">
            Up to 6 categories shown as quick-navigation chips at the top of the
            search drawer. Selection order = display order.
          </p>
        </div>
        <TopCategoriesMultiSelect
          categories={categories}
          selectedSlugs={chipCategorySlugs}
          onChange={setChipCategorySlugs}
          maxSelected={6}
        />
      </div>

      {/* Field 3: Curated products category */}
      <div className="space-y-3 max-w-[72ch]">
        <div className="space-y-1">
          <Label className="text-sm font-medium">
            Curated products category
          </Label>
          <p className="text-sm text-muted-foreground">
            Products from this category appear in the curated section (empty
            state + no-results state). Pick any existing category — admin
            controls whether it also appears in the storefront menu via the
            Menu Builder&apos;s label assignments.
          </p>
        </div>
        <CuratedCategorySelect
          categories={categories}
          selectedSlug={curatedCategorySlug}
          onChange={setCuratedCategorySlug}
        />
      </div>

      {/* Save button */}
      <div className="flex flex-col mt-auto pt-5">
        <Button onClick={handleSave} disabled={saving} className="w-fit">
          {saving ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="size-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
