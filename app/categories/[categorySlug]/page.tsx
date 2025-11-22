import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getProductsByCategorySlug,
  getCategorySlugs,
} from "@/lib/data";
import CategoryClientPage from "@components/app-components/CategoryClientPage";

// Re-fetch this page in the background, at most once per hour.
// This ensures new products added to a category will eventually appear.
export const revalidate = 3600;

interface CategoryPageProps {
  // We allow params to be a Promise to satisfy the Next.js runtime warning
  params: { categorySlug: string } | Promise<{ categorySlug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug } = (await params) as { categorySlug?: string };

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
    />
  );
}

/**
 * This function pre-renders all category pages at build time
 */
export async function generateStaticParams() {
  const categories = await getCategorySlugs();

  // Returns: [{ categorySlug: 'blends' }, { categorySlug: 'single-origin' }]
  return categories.map((c) => ({
    categorySlug: c.slug,
  }));
}
