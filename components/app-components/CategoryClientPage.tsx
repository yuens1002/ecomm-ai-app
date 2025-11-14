"use client";

import { CategoryProduct } from "@/lib/types";
import ProductCard from "@components/app-components/ProductCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

interface CategoryClientPageProps {
  categoryName: string;
  categorySlug: string;
  products: CategoryProduct[];
}

export default function CategoryClientPage({
  categoryName,
  categorySlug,
  products,
}: CategoryClientPageProps) {
  const handleAddToCart = (productId: string) => {
    // Mock implementation for now
    console.log(`(CategoryPage) Add to cart: ${productId}`);
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* 1. Breadcrumb (Home > Category) */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{categoryName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-4xl font-bold text-text-base mb-12">
        {categoryName}
      </h1>

      {products.length === 0 ? (
        <p className="text-text-muted">No products found in this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product as any} // Cast as 'any' because getProductsByCategorySlug is partial
              onAddToCart={handleAddToCart}
              showPurchaseOptions={true} // Show button on category page
              categorySlug={categorySlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
