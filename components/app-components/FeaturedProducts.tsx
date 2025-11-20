"use client";

import React, { useState, useEffect } from "react";
import { FeaturedProduct } from "@/lib/types"; // Import shared types
import ProductCard from "@components/app-components/ProductCard";

// This component is now self-contained. It fetches its own data.
// Changed from arrow function to function declaration
export default function FeaturedProducts() {
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
    <section className="container mx-auto px-4 md:px-8 py-16">
      <h2 className="text-3xl font-bold text-center text-text-base mb-12">
        Our Small Batch Collection
      </h2>

      {isLoading ? (
        <div className="text-center text-text-muted">Loading coffees...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-0 shadow-none">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showPurchaseOptions={false} // <-- Prop to hide price/button
            />
          ))}
        </div>
      )}
    </section>
  );
}
