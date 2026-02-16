import Link from "next/link";
import ProductCard from "@/app/(site)/_components/product/ProductCard";
import { FeaturedProduct } from "@/lib/types";
import { Sparkles, TrendingUp } from "lucide-react";

interface RecommendationsSectionProps {
  products: FeaturedProduct[];
  isPersonalized: boolean;
  source: "behavioral" | "trending";
  userPreferences?: {
    preferredRoastLevel?: string;
    topTastingNotes?: string[];
  };
  personalizedHeading: string;
  trendingHeading: string;
  trendingDescription: string;
  exploreAllText: string;
}

export default function RecommendationsSection({
  products,
  isPersonalized,
  userPreferences,
  personalizedHeading,
  trendingHeading,
  trendingDescription,
  exploreAllText,
}: RecommendationsSectionProps) {
  if (products.length === 0) {
    return null;
  }

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
                {isPersonalized ? personalizedHeading : trendingHeading}
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
              {trendingDescription}
            </p>
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product, index) => (
            <div key={product.id}>
              <ProductCard
                product={product}
                showPurchaseOptions={true}
                hoverRevealFooter={true}
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* View More Link */}
        {products.length >= 6 && (
          <div className="text-center mt-8">
            <Link
              href="/products"
              className="text-accent hover:text-accent/80 font-medium inline-flex items-center gap-2"
            >
              {exploreAllText}
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
