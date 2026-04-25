"use client";

import { ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DropdownContent } from "@/app/admin/product-menu/menu-builder/components/menu-action-bar/DropdownContent";
import { useState } from "react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface TopCategoriesMultiSelectProps {
  categories: CategoryOption[];
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
  maxSelected: number;
}

/**
 * Multi-select for Top Categories — reuses Menu Builder's DropdownContent
 * primitive (CheckboxListContent under the hood). Search input + Added /
 * Available checkbox sections.
 *
 * 6-cap enforced via per-item disabled in the Available section when count
 * is at max. Selection order preserved (slug array, not set).
 */
export function TopCategoriesMultiSelect({
  categories,
  selectedSlugs,
  onChange,
  maxSelected,
}: TopCategoriesMultiSelectProps) {
  const [searchValue, setSearchValue] = useState("");
  const [open, setOpen] = useState(false);

  const filteredCategories = searchValue.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchValue.trim().toLowerCase())
      )
    : categories;

  const selectedSet = new Set(selectedSlugs);
  const atCap = selectedSlugs.length >= maxSelected;

  const addedItems = selectedSlugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is CategoryOption => c != null)
    .filter((c) =>
      searchValue.trim()
        ? c.name.toLowerCase().includes(searchValue.trim().toLowerCase())
        : true
    )
    .map((c) => ({ id: c.slug, name: c.name, checked: true }));

  // When at cap, hide the Available section entirely so admin can't try to add more.
  // The 6 / 6 selected indicator in the trigger conveys the cap.
  const availableItems = atCap
    ? []
    : filteredCategories
        .filter((c) => !selectedSet.has(c.slug))
        .map((c) => ({
          id: c.slug,
          name: c.name,
          checked: false,
        }));

  function handleToggle(slug: string, checked: boolean) {
    if (checked) {
      if (selectedSet.has(slug) || selectedSlugs.length >= maxSelected) return;
      onChange([...selectedSlugs, slug]);
    } else {
      onChange(selectedSlugs.filter((s) => s !== slug));
    }
  }

  function handleRemoveChip(slug: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onChange(selectedSlugs.filter((s) => s !== slug));
  }

  return (
    <div className="space-y-3">
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
            type="button"
          >
            <span className="text-muted-foreground">
              {selectedSlugs.length === 0
                ? "Select up to 6 categories…"
                : `${selectedSlugs.length} / ${maxSelected} selected`}
            </span>
            <ChevronDown className="size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[var(--radix-dropdown-menu-trigger-width)]"
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownContent
            searchable
            searchPlaceholder="Search categories…"
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            sections={[
              { label: "Added", items: addedItems },
              { label: "Available", items: availableItems },
            ]}
            onItemToggle={handleToggle}
            emptyMessage="No categories found"
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected chip preview row */}
      {selectedSlugs.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selectedSlugs.map((slug) => {
            const cat = categories.find((c) => c.slug === slug);
            if (!cat) return null;
            return (
              <li
                key={slug}
                className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-md border bg-muted/30 text-sm"
              >
                <span>{cat.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveChip(slug, e)}
                  className="p-0.5 rounded hover:bg-muted-foreground/20 transition-colors"
                  aria-label={`Remove ${cat.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
