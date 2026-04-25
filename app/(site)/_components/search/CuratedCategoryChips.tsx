"use client";

import Link from "next/link";
import type { SearchDrawerChip } from "@/lib/data";
import { useSearchDrawerStore } from "./store";

/**
 * Renders the chip row in the search drawer's empty state.
 * Each chip links to its category page; clicking closes the drawer.
 */
export function CuratedCategoryChips({
  heading,
  chips,
}: {
  heading: string;
  chips: SearchDrawerChip[];
}) {
  const close = useSearchDrawerStore((s) => s.close);

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
        {chips.map((chip) => (
          <li key={chip.slug}>
            <Link
              href={`/categories/${chip.slug}`}
              onClick={close}
              className="inline-flex items-center px-4 py-2 rounded-md border bg-background hover:bg-accent transition-colors text-sm"
            >
              {chip.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
