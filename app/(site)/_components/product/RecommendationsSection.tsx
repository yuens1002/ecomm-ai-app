"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "motion/react";
import ProductCard from "@/app/(site)/_components/product/ProductCard";
import { Sparkles, TrendingUp } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  type: string;
  roastLevel: string;
  isFeatured: boolean;
  tastingNotes: string[];
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
  categories: Array<{
    category: {
      name: string;
      slug: string;
    };
  }>;
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
  const { settings } = useSiteSettings();
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
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
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
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              {isPersonalized ? (
                <div className="mt-1 shrink-0"><Sparkles className="h-6 w-6" /></div>
              ) : (
                <div className="mt-1 shrink-0"><TrendingUp className="h-6 w-6" /></div>
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-text-base">
                {isPersonalized
                  ? settings.homepageRecommendationsPersonalizedHeading
                  : settings.homepageRecommendationsTrendingHeading}
              </h2>
            </div>
          </div>
          {isPersonalized && userPreferences && (
            <p className="text-sm text-muted-foreground mt-1">
              Based on your love for{" "}
              {userPreferences.preferredRoastLevel?.toLowerCase() +
                " roasts with"}
              {userPreferences.topTastingNotes &&
                userPreferences.topTastingNotes.length > 0 && (
                  <>
                    {" "}
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
              {settings.homepageRecommendationsTrendingDescription}
            </p>
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
            >
              <ProductCard
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                product={product as any}
                showPurchaseOptions={true}
                hoverRevealFooter={true}
                priority={index === 0} // Load first image eagerly as it's likely LCP
              />
            </motion.div>
          ))}
        </div>

        {/* View More Link (Optional) */}
        {products.length >= 6 && (
          <div className="text-center mt-8">
            <Link
              href="/products"
              className="text-accent hover:text-accent/80 font-medium inline-flex items-center gap-2"
            >
              {settings.homepageRecommendationsExploreAllText}
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
