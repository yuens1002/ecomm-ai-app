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
import { useSearchDrawerStore } from "./store";
import { useSearchIndex } from "./hooks/useSearchIndex";
import { cn } from "@/lib/utils";

/**
 * Search drawer overlay. Fullscreen on mobile, top-anchored on desktop with
 * backdrop blur for "context underneath".
 *
 * As-you-type client-side search via MiniSearch (fuzzy + field-weighted).
 * Empty state / curated content wired in commit 4.
 */
export function SearchDrawer() {
  const isOpen = useSearchDrawerStore((s) => s.isOpen);
  const close = useSearchDrawerStore((s) => s.close);
  const [query, setQuery] = useState("");

  const { status, search } = useSearchIndex(isOpen);
  const results = search(query);
  const hasQuery = query.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className={cn(
          // Reset shadcn Dialog defaults that center on screen
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
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">
            {status === "loading" && !hasQuery && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {status === "error" && (
              <p className="text-sm text-destructive">
                Search is temporarily unavailable. Try the category navigation.
              </p>
            )}
            {status === "ready" && !hasQuery && (
              <p className="text-sm text-muted-foreground">
                Curated content wired in commit 4.
              </p>
            )}
            {status === "ready" && hasQuery && (
              <SearchResultsList results={results} query={query} onClose={close} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchResultsList({
  results,
  query,
  onClose,
}: {
  results: ReturnType<ReturnType<typeof useSearchIndex>["search"]>;
  query: string;
  onClose: () => void;
}) {
  if (results.length === 0) {
    return (
      <p className="text-base">
        No results found for <span className="font-semibold">&ldquo;{query}&rdquo;</span>
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Results for <span className="font-medium">&ldquo;{query}&rdquo;</span>
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((p) => (
          <li key={p.id}>
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
    </>
  );
}
