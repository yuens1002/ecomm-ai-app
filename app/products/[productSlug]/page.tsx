import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
  getAllProductSlugs,
} from "@/lib/data";
import ProductClientPage from "@components/app-components/ProductClientPage";

export const revalidate = 3600; // Re-fetch this page in the background, at most once per hour

// This is a dynamic page, so we receive `params`
interface ProductPageProps {
  // We allow params to be a Promise to satisfy the Next.js runtime warning
  params: { productSlug: string } | Promise<{ productSlug: string }>;
  searchParams: Promise<{
    from?: string; // The category slug that the user came from
  }>;
}

// This is a Server Component that fetches data
export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  // `params` may be a Promise; await it before reading `slug`.
  const { productSlug } = (await params) as { productSlug?: string };

  // `searchParams` in Next.js 15+ might also be a Promise
  const resolvedSearchParams = await searchParams;
  // Normalize the `from` param: it may be string | string[] | undefined
  let fromCategorySlugRaw = resolvedSearchParams?.from;
  if (Array.isArray(fromCategorySlugRaw)) {
    fromCategorySlugRaw = fromCategorySlugRaw[0];
  }
  const fromCategorySlug = fromCategorySlugRaw
    ? decodeURIComponent(String(fromCategorySlugRaw))
    : undefined;

  // If the route was reached without a slug, return a 404 immediately.
  if (!productSlug) {
    notFound();
  }

  const product = await getProductBySlug(productSlug);

  // If no product is found, show a 404 page
  if (!product) {
    notFound();
  }

  // Find the category to display in the breadcrumb
  // Priority: 1) The category they navigated from, 2) The primary category, 3) First category
  let displayCategory;

  if (fromCategorySlug) {
    // Check if it's a virtual roast category
    if (fromCategorySlug.endsWith("-roast")) {
      const roastLevel = fromCategorySlug.replace("-roast", "").toUpperCase();
      if (product.roastLevel === roastLevel) {
        displayCategory = {
          name:
            roastLevel.charAt(0) + roastLevel.slice(1).toLowerCase() + " Roast",
          slug: fromCategorySlug,
        };
      }
    }

    if (!displayCategory) {
      // Only use the `from` category if the product is actually linked to it
      displayCategory = product.categories.find(
        (c) => c.category.slug === fromCategorySlug
      )?.category;
    }
  }

  // If no category from URL or category not found, fall back to primary or first
  if (!displayCategory) {
    const primaryCategory = product.categories.find(
      (c) => c.isPrimary
    )?.category;
    displayCategory = primaryCategory || product.categories[0]?.category;
  }

  if (!displayCategory) {
    // This should not happen if your seed data is correct
    throw new Error(`Product ${product.name} is not linked to any category.`);
  }

  // Fetch related products based on the current product's roast level
  const relatedProducts = await getRelatedProducts(
    product.id,
    product.roastLevel
  );

  return (
    // Pass the fetched data as props to the Client Component
    <ProductClientPage
      product={product}
      relatedProducts={relatedProducts} // Pass the chosen category for the breadcrumb
      category={displayCategory}
    />
  );
}

// --- NEW: Re-added generateStaticParams ---
/**
 * This function runs at build time (e.g., when you deploy to Vercel).
 * It fetches all product slugs from the database and tells Next.js
 * to pre-render a static HTML page for each one.
 */
export async function generateStaticParams() {
  const products = await getAllProductSlugs(); // Fetches [{ productSlug: '...' }]

  return products.map((product) => ({
    productSlug: product.productSlug,
  }));
}
