"use client";

import { motion } from "motion/react";
import { CategoryProduct } from "@/lib/types";
import ProductCard from "@/app/(site)/_components/product/ProductCard";
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
  showPurchaseOptions: boolean;
}

export default function CategoryClientPage({
  categoryName,
  categorySlug,
  products,
  showPurchaseOptions,
}: CategoryClientPageProps) {
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
                showPurchaseOptions={showPurchaseOptions}
                categorySlug={categorySlug}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
