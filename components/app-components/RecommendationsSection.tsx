"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ProductCard from "@/components/app-components/ProductCard";
import { Sparkles, TrendingUp } from "lucide-react";

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  roastLevel: string;
  tastingNotes: string[];
  images: any[];
  variants: any[];
  categories: any[];
}

interface RecommendationsResponse {
  products: RecommendedProduct[];
  isPersonalized: boolean;
  source: "behavioral" | "trending";
  userPreferences?: {
    preferredRoastLevel?: string;
    topTastingNotes?: string[];
  };
}

export default function RecommendationsSection() {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] =
    useState<RecommendationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/recommendations?limit=6");
        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }
        const data = await response.json();
        setRecommendations(data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    // Only fetch when session status is determined
    if (status !== "loading") {
      fetchRecommendations();
    }
  }, [status, session]);

  if (error) {
    return null; // Silently fail - don't show section if there's an error
  }

  if (isLoading) {
    return (
      <section className="bg-secondary py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-48 w-full rounded-lg bg-muted animate-pulse" />
                <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!recommendations || recommendations.products.length === 0) {
    return null; // Don't show section if no recommendations
  }

  const { products, isPersonalized, userPreferences } = recommendations;

  return (
    <section className="bg-secondary py-12">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isPersonalized ? (
              <Sparkles className="h-6 w-6 text-accent" />
            ) : (
              <TrendingUp className="h-6 w-6 text-accent" />
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-base">
                {isPersonalized ? "Recommended For You" : "Trending Now"}
              </h2>
              {isPersonalized && userPreferences && (
                <p className="text-sm text-muted-foreground mt-1">
                  Based on your love for{" "}
                  {userPreferences.preferredRoastLevel?.toLowerCase()} roasts
                  {userPreferences.topTastingNotes &&
                    userPreferences.topTastingNotes.length > 0 && (
                      <>
                        {" "}
                        with{" "}
                        {userPreferences.topTastingNotes
                          .slice(0, 2)
                          .join(" and ")}{" "}
                        notes
                      </>
                    )}
                </p>
              )}
              {!isPersonalized && (
                <p className="text-sm text-muted-foreground mt-1">
                  Discover what other coffee lovers are enjoying
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product as any}
              categorySlug={
                isPersonalized
                  ? "recommendations-personalized"
                  : "recommendations-trending"
              }
            />
          ))}
        </div>

        {/* View More Link (Optional) */}
        {products.length >= 6 && (
          <div className="text-center mt-8">
            <Link
              href="/products"
              className="text-accent hover:text-accent/80 font-medium inline-flex items-center gap-2"
            >
              Explore All Coffees
              <svg
                className="h-4 w-4"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
