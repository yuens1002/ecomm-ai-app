import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getProductsByCategorySlug,
  getCategorySlugs,
} from "@/lib/data";
import CategoryClientPage from "@/app/(site)/_components/category/CategoryClientPage";

// Re-fetch this page in the background, at most once per hour.
// This ensures new products added to a category will eventually appear.
export const revalidate = 3600;

interface CategoryPageProps {
  // We allow params to be a Promise to satisfy the Next.js runtime warning
  params: { category: string } | Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return {};

  const title = category.name;
  const description = `Browse our ${category.name.toLowerCase()} collection — specialty coffee curated for quality.`;

  return { title, description, openGraph: { title, description } };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = (await params) as { category?: string };

  if (!categorySlug) {
    notFound();
  }

  // 1. Fetch the category information
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  // 2. Fetch the products for that category
  const products = await getProductsByCategorySlug(categorySlug);

  return (
    <CategoryClientPage
      categoryName={category.name}
      categorySlug={categorySlug}
      products={products}
      showPurchaseOptions={category.showPurchaseOptions}
    />
  );
}

// Allow ISR for non-pre-rendered paths (works with SKIP_SSG in CI)
export const dynamicParams = true;

/**
 * This function pre-renders all category pages at build time
 *
 * Set SKIP_SSG=true in CI to skip static generation and reduce DB connections
 */
export async function generateStaticParams() {
  if (process.env.SKIP_SSG === "true") {
    return [];
  }

  const categories = await getCategorySlugs();

  // Returns: [{ category: 'blends' }, { category: 'single-origin' }, { category: 'light-roast' }]
  return categories.map((c) => ({
    category: c.slug,
  }));
}
