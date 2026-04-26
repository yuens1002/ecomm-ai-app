"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { LabelSelect } from "./LabelSelect";
import { CuratedCategorySelect } from "./CuratedCategorySelect";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface LabelOption {
  id: string;
  name: string;
  isVisible: boolean;
  categories: { category: { name: string; slug: string } }[];
}

interface SearchSettings {
  chipLabelId: string | null;
  curatedCategorySlug: string | null;
}

interface SearchSettingsFormProps {
  initialSettings: SearchSettings;
  labels: LabelOption[];
  categories: CategoryOption[];
  defaultLabelId: string | null;
  defaultCategorySlug: string | null;
}

/**
 * Two-section admin form with no Save button. Each change auto-saves via
 * partial PUT; on failure, the field silently rolls back to its prior value.
 *
 * Initial display shows the persisted value if any, otherwise the platform
 * default (1st label / category by `order`). Empty-string curated value is
 * the "explicitly cleared" sentinel and renders as no selection.
 */
export function SearchSettingsForm({
  initialSettings,
  labels,
  categories,
  defaultLabelId,
  defaultCategorySlug,
}: SearchSettingsFormProps) {
  const initialLabelId = initialSettings.chipLabelId ?? defaultLabelId;
  const initialCuratedSlug =
    initialSettings.curatedCategorySlug === null
      ? defaultCategorySlug
      : initialSettings.curatedCategorySlug === ""
        ? null
        : initialSettings.curatedCategorySlug;

  const [chipLabelId, setChipLabelId] = useState<string | null>(initialLabelId);
  const [curatedSlug, setCuratedSlug] = useState<string | null>(
    initialCuratedSlug
  );

  async function autoSave(
    body: { chipLabelId?: string; curatedCategorySlug?: string },
    rollback: () => void
  ) {
    try {
      const res = await fetch("/api/admin/settings/search-drawer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) rollback();
    } catch {
      rollback();
    }
  }

  function handleLabelChange(id: string) {
    const prev = chipLabelId;
    setChipLabelId(id); // optimistic
    void autoSave({ chipLabelId: id }, () => setChipLabelId(prev));
  }

  function handleCuratedChange(slug: string | null) {
    const prev = curatedSlug;
    setCuratedSlug(slug);
    void autoSave({ curatedCategorySlug: slug ?? "" }, () =>
      setCuratedSlug(prev)
    );
  }

  return (
    <div className="space-y-12">
      {/* Section 1: Search drawer chips */}
      <div className="space-y-3 max-w-[72ch]">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Search drawer chips</Label>
          <p className="text-sm text-muted-foreground">
            Use Menu Builder to add or select an existing label to showcase
            categories.
          </p>
        </div>
        <LabelSelect
          labels={labels}
          selectedId={chipLabelId}
          onChange={handleLabelChange}
        />
      </div>

      {/* Section 2: Curated products */}
      <div className="space-y-3 max-w-[72ch]">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Curated products</Label>
          <p className="text-sm text-muted-foreground">
            Select a product category to show as the default or when no search
            is found.
          </p>
        </div>
        <CuratedCategorySelect
          categories={categories}
          selectedSlug={curatedSlug}
          onChange={handleCuratedChange}
        />
      </div>
    </div>
  );
}
