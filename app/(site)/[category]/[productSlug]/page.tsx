import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import ProductClientPage from "@components/app-components/ProductClientPage";

export const revalidate = 3600; // Re-fetch this page in the background, at most once per hour

// This is a dynamic page, so we receive `params`
interface ProductPageProps {
  // We allow params to be a Promise to satisfy the Next.js runtime warning
  params:
    | { category: string; productSlug: string }
    | Promise<{ category: string; productSlug: string }>;
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
  const { category: categorySlug, productSlug } = (await params) as {
    category?: string;
    productSlug?: string;
  };

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
  if (!productSlug || !categorySlug) {
    notFound();
  }

  const product = await getProductBySlug(productSlug);

  // If no product is found, show a 404 page
  if (!product) {
    notFound();
  }

  // Determine the display category for the breadcrumb
  // Priority: 1) The category they navigated from (via ?from=), 2) The URL category, 3) Not found
  let displayCategory;

  if (fromCategorySlug) {
    // If there's a "from" parameter, use that category if the product has it
    displayCategory = product.categories.find(
      (c) => c.category.slug === fromCategorySlug
    )?.category;
  }

  // If no "from" category or not found, use the URL category
  if (!displayCategory) {
    displayCategory = product.categories.find(
      (c) => c.category.slug === categorySlug
    )?.category;
  }

  // Fallback (shouldn't happen if URL is valid, but good for safety)
  if (!displayCategory) {
    // If the user manually typed a URL like /random-category/product-slug,
    // and the product exists but isn't in that category, we might want to 404
    notFound();
  }

  // Fetch related products from the same category the user is viewing
  // Use the "from" category if available (where they came from), otherwise use the URL category
  const relatedCategorySlug = fromCategorySlug || categorySlug;
  const relatedProducts = await getRelatedProducts(
    product.id,
    relatedCategorySlug
  );

  return (
    // Pass the fetched data as props to the Client Component
    <ProductClientPage
      product={product}
      relatedProducts={relatedProducts}
      category={displayCategory}
    />
  );
}

/**
 * This function runs at build time.
 * It generates all valid paths for [category]/[productSlug].
 */
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    select: {
      slug: true,
      categories: {
        include: {
          category: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  const paths = [];

  for (const product of products) {
    // 1. Paths for DB categories (e.g. /blends/midnight-espresso)
    // This now includes Origins, Micro Lots, Blends, and Roasts as they are in the DB
    for (const c of product.categories) {
      paths.push({
        category: c.category.slug,
        productSlug: product.slug,
      });
    }
  }

  return paths;
}
