"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { SearchDrawerConfig } from "@/lib/data";
import { useSearchDrawerStore } from "./store";
import { useSearchIndex } from "./hooks/useSearchIndex";
import { useSearchAnalytics } from "./hooks/useSearchAnalytics";
import { CuratedCategoryChips } from "./CuratedCategoryChips";
import { CuratedProducts } from "./CuratedProducts";
import { cn } from "@/lib/utils";

interface SearchDrawerProps {
  config: SearchDrawerConfig;
}

/**
 * Search drawer overlay. Fullscreen on mobile, top-anchored on desktop with
 * backdrop blur for "context underneath".
 *
 * Three states:
 * - Empty (no query): chips + curated products
 * - Results (query has matches): result cards
 * - No-results (query, zero matches): "No results for X" + curated products
 */
export function SearchDrawer({ config }: SearchDrawerProps) {
  const isOpen = useSearchDrawerStore((s) => s.isOpen);
  const close = useSearchDrawerStore((s) => s.close);
  const [query, setQuery] = useState("");

  const { status, search } = useSearchIndex(isOpen);
  useSearchAnalytics(query, isOpen);
  const results = search(query);
  const hasQuery = query.trim().length > 0;

  const curatedHeading = config.curatedCategoryName ?? "Featured";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className={cn(
          "p-0 gap-0 max-w-none rounded-none border-0 sm:rounded-none",
          // Mobile: fullscreen
          "fixed inset-0 left-0 right-0 top-0 bottom-0 translate-x-0 translate-y-0 w-screen h-screen",
          // Desktop: top-anchored, max-w-4xl, max-h-[80vh], rounded bottom
          "md:left-1/2 md:right-auto md:top-0 md:bottom-auto md:-translate-x-1/2 md:translate-y-0",
          "md:w-full md:max-w-4xl md:max-h-[80vh] md:rounded-b-xl md:border md:shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "md:data-[state=open]:slide-in-from-top-4 md:data-[state=closed]:slide-out-to-top-4",
          "duration-200"
        )}
      >
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <DialogDescription className="sr-only">
          Search for coffee, brewing equipment, and more.
        </DialogDescription>

        <div className="flex flex-col h-full md:max-h-[80vh] overflow-hidden">
          {/* Search input row */}
          <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products…"
                className="pl-10 h-11 text-base"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
                aria-controls="search-drawer-results"
              />
            </div>
          </div>

          {/* Body */}
          <div
            id="search-drawer-results"
            className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8"
            aria-busy={status === "loading"}
          >
            {status === "loading" && !hasQuery && (
              <LoadingSkeleton />
            )}
            {status === "error" && (
              <p className="text-sm text-destructive mb-6" role="alert">
                Search is temporarily unavailable. You can still browse via the
                categories below.
              </p>
            )}

            {/* Chips persist across empty / results / no-results states */}
            {status !== "loading" && config.chips.length > 0 && (
              <CuratedCategoryChips
                heading={config.chipsHeading}
                chips={config.chips}
              />
            )}

            {status !== "loading" && !hasQuery && (
              <EmptyState
                hasChips={config.chips.length > 0}
                curatedHeading={curatedHeading}
                curatedProducts={config.curatedProducts}
              />
            )}

            {hasQuery && (
              <ResultsOrNoResults
                results={results}
                query={query}
                onClose={close}
                curatedHeading={curatedHeading}
                curatedProducts={config.curatedProducts}
                hasChips={config.chips.length > 0}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({
  hasChips,
  curatedHeading,
  curatedProducts,
}: {
  hasChips: boolean;
  curatedHeading: string;
  curatedProducts: SearchDrawerConfig["curatedProducts"];
}) {
  // First-time admin state: nothing configured. Show a hint instead of empty space.
  // Chips are rendered separately above by the parent.
  if (!hasChips && curatedProducts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Type a product name, origin, or tasting note to search.
      </p>
    );
  }

  return <CuratedProducts heading={curatedHeading} products={curatedProducts} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div>
        <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 w-24 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square bg-muted rounded-md animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsOrNoResults({
  results,
  query,
  onClose,
  curatedHeading,
  curatedProducts,
  hasChips,
}: {
  results: ReturnType<ReturnType<typeof useSearchIndex>["search"]>;
  query: string;
  onClose: () => void;
  curatedHeading: string;
  curatedProducts: SearchDrawerConfig["curatedProducts"];
  hasChips: boolean;
}) {
  // Note: chips are rendered above by the parent and persist across states.
  // Add top spacing here when chips are present so the section header doesn't
  // bump up against the chip row.
  const topSpacingClass = hasChips ? "mt-8" : "";

  if (results.length === 0) {
    return (
      <div aria-live="polite" className={topSpacingClass}>
        <p className="text-base mb-2">
          No results found for{" "}
          <span className="font-semibold">&ldquo;{query}&rdquo;</span>
        </p>
        {curatedProducts.length > 0 && (
          <p className="text-sm text-muted-foreground mb-8">
            In the meantime, check out our {curatedHeading.toLowerCase()}.
          </p>
        )}
        <CuratedProducts heading={curatedHeading} products={curatedProducts} />
      </div>
    );
  }

  return (
    <div className={topSpacingClass}>
      <p
        className="text-sm text-muted-foreground mb-4"
        aria-live="polite"
      >
        Results for{" "}
        <span className="font-medium">&ldquo;{query}&rdquo;</span>
      </p>
      <ul
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        // Re-key the list on query change so fade-in animation re-fires
        key={query}
      >
        {results.map((p, idx) => (
          <li
            key={p.id}
            className="animate-in fade-in-0 duration-300"
            style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
          >
            <Link
              href={`/products/${p.slug}`}
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-lg border hover:shadow-md transition-shadow"
            >
              {p.primaryImage ? (
                <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                  <Image
                    src={p.primaryImage.url}
                    alt={p.primaryImage.altText ?? p.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 flex-shrink-0 rounded-md bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                {p.tastingNotes.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {p.tastingNotes.slice(0, 3).join(", ")}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
