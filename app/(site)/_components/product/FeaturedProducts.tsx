"use client";

import React, { useState, useEffect } from "react";
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
          <div className="text-center text-text-muted">Loading coffees...</div>
        ) : (
          <div className="[--slide-size:66.67%] md:[--slide-size:40%] lg:[--slide-size:28.57%]">
          <ScrollCarousel
            showDots={true}
            noBorder={true}
            minWidth="var(--slide-size)"
          >
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                showPurchaseOptions={true}
                hoverRevealFooter={true}
                compactFooter={true}
                priority={index < 4}
              />
            ))}
          </ScrollCarousel>
          </div>
        )}
      </div>
    </section>
  );
}
