"use client";

import type { SearchDrawerCuratedProduct } from "@/lib/data";
import ProductCard from "@/app/(site)/_components/product/ProductCard";

interface CuratedProductsProps {
  heading: string;
  products: SearchDrawerCuratedProduct[];
}

/**
 * Renders the curated products section in the search drawer using the
 * canonical ProductCard component (matches storefront cards visually,
 * fixes blank-image edge cases via getPlaceholderImage in ProductCard).
 *
 * Used in three states: empty, no-results fallback, and chip-active filtered.
 */
export function CuratedProducts({ heading, products }: CuratedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="search-drawer-curated-heading" className="mt-12">
      <h2
        id="search-drawer-curated-heading"
        className="text-base font-semibold mb-4"
      >
        {heading}
      </h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
