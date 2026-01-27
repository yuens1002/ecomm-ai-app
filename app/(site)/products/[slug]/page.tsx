import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import ProductClientPage from "./ProductClientPage";
import { getProductAddOns } from "./actions";

export const revalidate = 3600; // Re-fetch this page in the background, at most once per hour

interface ProductPageProps {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}

/**
 * Canonical product page at /products/{slug}
 * Supports ?from= parameter to preserve user's navigation journey in breadcrumb
 */
export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = (await params) as { slug?: string };

  if (!slug) {
    notFound();
  }

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Get the "from" category if user navigated from a category page
  const resolvedSearchParams = await searchParams;
  let fromCategorySlug = resolvedSearchParams?.from;
  if (Array.isArray(fromCategorySlug)) {
    fromCategorySlug = fromCategorySlug[0];
  }
  const decodedFromSlug = fromCategorySlug
    ? decodeURIComponent(String(fromCategorySlug))
    : undefined;

  // Determine display category for breadcrumb:
  // 1. Use "from" category if provided and product belongs to it
  // 2. Otherwise use primary category
  // 3. Fallback to first category
  let displayCategory;

  if (decodedFromSlug) {
    displayCategory = product.categories.find(
      (c) => c.category.slug === decodedFromSlug
    )?.category;
  }

  if (!displayCategory) {
    const primaryCategoryRelation = product.categories.find((c) => c.isPrimary);
    displayCategory =
      primaryCategoryRelation?.category || product.categories[0]?.category;
  }

  if (!displayCategory) {
    notFound();
  }

  // Fetch related products from the display category (follows user's journey)
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
