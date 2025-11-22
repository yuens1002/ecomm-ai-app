"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import ProductCard from "@/components/app-components/ProductCard";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  origin: string[];
  tastingNotes: string[];
  isFeatured: boolean;
  categories: Array<{
    category: {
      name: string;
      slug: string;
    };
  }>;
  images: Array<{
    id: string;
    order: number;
    url: string;
    altText: string;
    productId: string;
  }>;
  variants: Array<{
    id: string;
    name: string;
    purchaseOptions: Array<{
      id: string;
      type: string;
      priceInCents: number;
      discountMessage: string | null;
      billingInterval: string | null;
      billingIntervalCount: number | null;
      variantId: string;
    }>;
  }>;
}

interface SearchResponse {
  products: SearchProduct[];
  query: string;
  count: number;
}

// Generate a session ID for tracking
function getSessionId() {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem("artisan_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("artisan_session_id", sessionId);
  }
  return sessionId;
}

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get("q");
    const roast = searchParams.get("roast");
    const origin = searchParams.get("origin");

    // Update query state if it changed externally
    if (q) setQuery(q);

    // Perform search if any param exists
    if (q || roast || origin) {
      performSearch(q, roast, origin);
    } else {
      setResults(null);
    }
  }, [searchParams]);

  async function performSearch(
    searchQuery: string | null,
    roast: string | null,
    origin: string | null
  ) {
    try {
      setIsLoading(true);
      setError(null);

      const sessionId = getSessionId();
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (roast) params.append("roast", roast);
      if (origin) params.append("origin", origin);
      if (sessionId) params.append("sessionId", sessionId);

      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to search products");
      }

      const data: SearchResponse = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  // Helper to generate title based on active filters
  function getResultsTitle() {
    const parts = [];
    const roast = searchParams.get("roast");
    const origin = searchParams.get("origin");
    const q = searchParams.get("q");

    if (roast)
      parts.push(
        `${roast.charAt(0).toUpperCase() + roast.slice(1).toLowerCase()} Roast`
      );
    if (origin) parts.push(origin);
    if (q) parts.push(`"${q}"`);

    if (parts.length === 0) return "products";
    return parts.join(" • ");
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for coffee..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          autoFocus
        />
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Results */}
      {results && !isLoading && (
        <>
          <div className="text-muted-foreground">
            {results.count === 0 ? (
              <p>No results found for {getResultsTitle()}</p>
            ) : (
              <p>
                Found {results.count}{" "}
                {results.count === 1 ? "result" : "results"} for{" "}
                {getResultsTitle()}
              </p>
            )}
          </div>

          {results.count > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.products.map((product) => (
                <ProductCard
                  key={product.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  product={product as any}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!results && !isLoading && !searchParams.toString() && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Enter a search term or select a category to find products</p>
        </div>
      )}
    </div>
  );
}
