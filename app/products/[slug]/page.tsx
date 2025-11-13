import { notFound } from "next/navigation";
// UPDATED: Import the new slug-fetching function
import {
  getProductBySlug,
  getRelatedProducts,
  getAllProductSlugs,
} from "@/lib/data";
import ProductClientPage from "@components/app-components/ProductClientPage";

export const revalidate = 3600; // Re-fetch this page in the background, at most once per hour

// This is a dynamic page, so we receive `params`
interface ProductPageProps {
  // `params` can be a Promise in some Next.js runtimes — allow either shape.
  params: { slug: string } | Promise<{ slug: string }>;
}

// This is a Server Component that fetches data
export default async function ProductPage({ params }: ProductPageProps) {
  // `params` may be a Promise; await it before reading `slug`.
  const { slug } = (await params) as { slug?: string };

  // If the route was reached without a slug, return a 404 immediately.
  if (!slug) {
    notFound();
  }

  const product = await getProductBySlug(slug);

  // If no product is found, show a 404 page
  if (!product) {
    notFound();
  }

  // Fetch related products based on the current product's roast level
  const relatedProducts = await getRelatedProducts(
    product.id,
    product.roastLevel
  );

  return (
    // Pass the fetched data as props to the Client Component
    <ProductClientPage product={product} relatedProducts={relatedProducts} />
  );
}

// --- NEW: Re-added generateStaticParams ---
/**
 * This function runs at build time (e.g., when you deploy to Vercel).
 * It fetches all product slugs from the database and tells Next.js
 * to pre-render a static HTML page for each one.
 */
export async function generateStaticParams() {
  const products = await getAllProductSlugs();

  // We must return an array of objects in this exact format:
  // [ { slug: 'product-1-slug' }, { slug: 'product-2-slug' } ]
  return products.map((product) => ({
    slug: product.slug,
  }));
}
