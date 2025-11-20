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
  roastLevel: string;
  isFeatured: boolean;
  categories: Array<{
    category: {
      name: string;
      slug: string;
    };
  }>;
  images: Array<{
    url: string;
    altText: string;
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
    const queryParam = searchParams.get("q");
    if (queryParam) {
      setQuery(queryParam);
      performSearch(queryParam);
    }
  }, [searchParams]);

  async function performSearch(searchQuery: string) {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const sessionId = getSessionId();
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&sessionId=${sessionId}`
      );

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
              <p>No results found for &ldquo;{results.query}&rdquo;</p>
            ) : (
              <p>
                Found {results.count}{" "}
                {results.count === 1 ? "result" : "results"} for &ldquo;
                {results.query}&rdquo;
              </p>
            )}
          </div>

          {results.count > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={
                    {
                      ...product,
                      category: product.categories[0]?.category || null,
                    } as any
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!results && !isLoading && query && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Enter a search term to find products</p>
        </div>
      )}
    </div>
  );
}
