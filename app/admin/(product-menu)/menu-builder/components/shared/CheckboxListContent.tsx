"use client";

import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenuCheckboxItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CheckboxListSection = {
  label?: string;
  items: Array<{
    id: string;
    name: string;
    checked: boolean;
  }>;
};

type CheckboxListContentProps = {
  /** Which menu primitive to use */
  variant: "dropdown" | "context-menu";
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sections: CheckboxListSection[];
  onItemToggle: (itemId: string, checked: boolean) => void | Promise<void>;
  emptyMessage?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generic checkbox list content for dropdown menus and context menus.
 * Provides consistent structure with sections, search, and checkbox items.
 */
export function CheckboxListContent({
  variant,
  searchable = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  sections,
  onItemToggle,
  emptyMessage = "No items found",
}: CheckboxListContentProps) {
  const hasItems = sections.some((section) => section.items.length > 0);

  // Select the appropriate primitives based on variant
  const CheckboxItem =
    variant === "dropdown" ? DropdownMenuCheckboxItem : ContextMenuCheckboxItem;
  const Label =
    variant === "dropdown" ? DropdownMenuLabel : ContextMenuLabel;
  const Separator =
    variant === "dropdown" ? DropdownMenuSeparator : ContextMenuSeparator;

  return (
    <>
      {searchable && onSearchChange && (
        <div className="px-2 py-2 border-b sticky top-0 bg-popover z-10">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-9"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto overflow-x-hidden p-1">
        {!hasItems ? (
          <div className="px-2 py-6 text-sm text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          sections.map((section, sectionIndex) => {
            if (section.items.length === 0) return null;

            const hasPreviousSections = sections
              .slice(0, sectionIndex)
              .some((s) => s.items.length > 0);

            return (
              <div key={sectionIndex}>
                {hasPreviousSections && <Separator />}
                {section.label && (
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {section.label}
                  </Label>
                )}
                {section.items.map((item) => (
                  <CheckboxItem
                    key={item.id}
                    checked={item.checked}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(checked) =>
                      onItemToggle(item.id, checked)
                    }
                  >
                    <span className="truncate">{item.name}</span>
                  </CheckboxItem>
                ))}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
