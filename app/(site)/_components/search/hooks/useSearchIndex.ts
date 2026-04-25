"use client";

import { useEffect, useMemo, useState } from "react";
import MiniSearch from "minisearch";

export type SearchProductType = "COFFEE" | "MERCH";

export interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  type: SearchProductType;
  description: string | null;
  tastingNotes: string[];
  origin: string[];
  roastLevel: string | null;
  isFeatured: boolean;
  primaryCategory: { name: string; slug: string } | null;
  primaryImage: { url: string; altText: string | null } | null;
  minPriceInCents: number | null;
}

interface IndexResponse {
  products: SearchProduct[];
  generatedAt: string;
}

export type IndexStatus = "idle" | "loading" | "ready" | "error";

interface IndexState {
  status: IndexStatus;
  products: SearchProduct[];
}

interface UseSearchIndexResult {
  status: IndexStatus;
  products: SearchProduct[];
  search: (query: string) => SearchProduct[];
  refetch: () => void;
}

const SEARCH_LIMIT = 10;

/**
 * Loads the catalog search index from /api/search/index and exposes a
 * MiniSearch-backed search() function. Field-weighted (name > tasting notes >
 * description > origin) and fuzzy-tolerant.
 *
 * State transitions happen only via async fetch callbacks (no synchronous
 * setState inside the effect body) — satisfies react-hooks/set-state-in-effect.
 *
 * No persistence — refetches when `enabled` flips on or refetch() is called.
 */
export function useSearchIndex(enabled: boolean): UseSearchIndexResult {
  const [state, setState] = useState<IndexState>(() => ({
    status: enabled ? "loading" : "idle",
    products: [],
  }));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetch("/api/search/index")
      .then((res) => {
        if (!res.ok) throw new Error(`Index fetch failed: ${res.status}`);
        return res.json() as Promise<IndexResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", products: data.products });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[useSearchIndex] fetch failed:", err);
        setState({ status: "error", products: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, refreshKey]);

  const miniSearch = useMemo(() => {
    if (state.status !== "ready") return null;
    const ms = new MiniSearch<SearchProduct>({
      idField: "id",
      fields: ["name", "tastingNotes", "description", "origin", "primaryCategoryName"],
      storeFields: [
        "id",
        "name",
        "slug",
        "type",
        "description",
        "tastingNotes",
        "origin",
        "roastLevel",
        "isFeatured",
        "primaryCategory",
        "primaryImage",
        "minPriceInCents",
      ],
      extractField: (doc, fieldName) => {
        if (fieldName === "tastingNotes") return doc.tastingNotes.join(" ");
        if (fieldName === "origin") return doc.origin.join(" ");
        if (fieldName === "primaryCategoryName")
          return doc.primaryCategory?.name ?? "";
        const value = (doc as unknown as Record<string, unknown>)[fieldName];
        return typeof value === "string" ? value : "";
      },
      searchOptions: {
        boost: {
          name: 4,
          tastingNotes: 2,
          primaryCategoryName: 2,
          origin: 1.5,
          description: 1,
        },
        fuzzy: 0.2,
        prefix: true,
        combineWith: "AND",
      },
    });
    ms.addAll(state.products);
    return ms;
  }, [state.products, state.status]);

  const search = (query: string): SearchProduct[] => {
    const trimmed = query.trim();
    if (!miniSearch || trimmed.length === 0) return [];
    const results = miniSearch.search(trimmed);
    const limited = results.slice(0, SEARCH_LIMIT);
    return limited
      .map((r) => state.products.find((p) => p.id === r.id))
      .filter((p): p is SearchProduct => p != null);
  };

  return {
    status: state.status,
    products: state.products,
    search,
    refetch: () => {
      setState((prev) => ({ ...prev, status: "loading" }));
      setRefreshKey((k) => k + 1);
    },
  };
}
