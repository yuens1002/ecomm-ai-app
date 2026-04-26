"use client";

import type { SearchDrawerChip } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Chip row in the search drawer. Clicking a chip filters the drawer body
 * in-place to that category's products (the parent owns the active state).
 * Clicking the active chip again deselects it.
 */
export function CuratedCategoryChips({
  heading,
  chips,
  activeChipSlug,
  onChipClick,
}: {
  heading: string;
  chips: SearchDrawerChip[];
  activeChipSlug: string | null;
  onChipClick: (slug: string) => void;
}) {
  if (chips.length === 0) return null;

  return (
    <section aria-labelledby="search-drawer-chips-heading">
      <h2
        id="search-drawer-chips-heading"
        className="text-base font-semibold mb-4"
      >
        {heading}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const isActive = activeChipSlug === chip.slug;
          return (
            <li key={chip.slug}>
              <button
                type="button"
                onClick={() => onChipClick(chip.slug)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground opacity-60 hover:opacity-80"
                )}
              >
                {chip.name}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
