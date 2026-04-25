"use client";

import Link from "next/link";
import Image from "next/image";
import type { SearchDrawerCuratedProduct } from "@/lib/data";
import { useSearchDrawerStore } from "./store";

interface CuratedProductsProps {
  heading: string;
  products: SearchDrawerCuratedProduct[];
}

/**
 * Renders the curated products section in the search drawer.
 * Heading is the picked category's display name (no separate setting).
 * Used in both empty state and zero-results state.
 */
export function CuratedProducts({ heading, products }: CuratedProductsProps) {
  const close = useSearchDrawerStore((s) => s.close);

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
            <Link
              href={`/products/${p.slug}`}
              onClick={close}
              className="block group"
            >
              <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-2">
                {p.primaryImage ? (
                  <Image
                    src={p.primaryImage.url}
                    alt={p.primaryImage.altText ?? p.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                ) : null}
              </div>
              <p className="text-sm font-medium line-clamp-2">{p.name}</p>
              {p.minPriceInCents != null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ${(p.minPriceInCents / 100).toFixed(2)}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
