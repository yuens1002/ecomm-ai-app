import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import ProductClientPage from "./ProductClientPage";
import { getProductAddOns } from "./actions";

export const revalidate = 3600; // Re-fetch this page in the background, at most once per hour

interface ProductPageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

/**
 * Canonical product page at /products/{slug}
 * Uses primary category for breadcrumbs and related products
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = (await params) as { slug?: string };

  if (!slug) {
    notFound();
  }

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Get primary category for breadcrumb and related products
  const primaryCategoryRelation = product.categories.find((c) => c.isPrimary);
  const displayCategory =
    primaryCategoryRelation?.category || product.categories[0]?.category;

  if (!displayCategory) {
    // Product has no categories - this shouldn't happen but handle gracefully
    notFound();
  }

  // Fetch related products from the primary category
  const relatedProducts = await getRelatedProducts(
    product.id,
    displayCategory.slug
  );

  // Fetch add-ons for this product
  const addOns = await getProductAddOns(product.id);

  return (
    <ProductClientPage
      product={product}
      relatedProducts={relatedProducts}
      category={displayCategory}
      addOns={addOns}
    />
  );
}

/**
 * Generate static paths for all products (one path per product)
 * This is much more efficient than generating paths for every product-category combination
 */
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    select: { slug: true },
    where: { isDisabled: false },
  });

  return products.map((product) => ({
    slug: product.slug,
  }));
}
