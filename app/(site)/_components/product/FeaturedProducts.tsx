"use client";

import { FeaturedProduct } from "@/lib/types";
import ProductCard from "@/app/(site)/_components/product/ProductCard";
import { ScrollCarousel } from "@/components/shared/media/ScrollCarousel";

interface FeaturedProductsProps {
  products: FeaturedProduct[];
  heading: string;
}

export default function FeaturedProducts({
  products,
  heading,
}: FeaturedProductsProps) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
        <h2 className="text-3xl font-bold text-center text-text-base mb-12">
          {heading}
        </h2>

        <div className="[--slide-size:66.67%] md:[--slide-size:40%] lg:[--slide-size:28.57%]">
          <ScrollCarousel
            showDots={true}
            noBorder={true}
            minWidth="var(--slide-size)"
          >
            {products.map((product, index) => (
              <div key={product.id}>
                <ProductCard
                  product={product}
                  showPurchaseOptions={true}
                  hoverRevealFooter={true}
                  compact={true}
                  priority={index < 4}
                  sizes="(max-width: 768px) 67vw, (max-width: 1200px) 40vw, 29vw"
                />
              </div>
            ))}
          </ScrollCarousel>
        </div>
      </div>
    </section>
  );
}
