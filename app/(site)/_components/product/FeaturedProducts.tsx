"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FeaturedProduct } from "@/lib/types";
import ProductCard from "@/app/(site)/_components/product/ProductCard";
import { ScrollCarousel } from "@/components/shared/media/ScrollCarousel";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// This component is now self-contained. It fetches its own data.
// Changed from arrow function to function declaration
export default function FeaturedProducts() {
  const { settings } = useSiteSettings();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch data from our API on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/products/featured");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data: FeaturedProduct[] = await response.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
        // You could set an error state here
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <section className="py-16">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
        <h2 className="text-3xl font-bold text-center text-text-base mb-12">
          {settings.homepageFeaturedHeading}
        </h2>

        {isLoading ? (
          <div className="[--slide-size:66.67%] md:[--slide-size:40%] lg:[--slide-size:28.57%]">
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0"
                  style={{ minWidth: "var(--slide-size)" }}
                >
                  <div className="aspect-square bg-muted animate-pulse rounded-t-lg" />
                  <div className="border-x border-b rounded-b-lg p-4 space-y-3">
                    <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                    <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="[--slide-size:66.67%] md:[--slide-size:40%] lg:[--slide-size:28.57%]">
          <ScrollCarousel
            showDots={true}
            noBorder={true}
            minWidth="var(--slide-size)"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
              >
                <ProductCard
                  product={product}
                  showPurchaseOptions={true}
                  hoverRevealFooter={true}
                  compact={true}
                  priority={index < 4}
                  sizes="(max-width: 768px) 67vw, (max-width: 1200px) 40vw, 29vw"
                />
              </motion.div>
            ))}
          </ScrollCarousel>
          </div>
        )}
      </div>
    </section>
  );
}
