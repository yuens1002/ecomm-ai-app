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
}

// This is a Server Component that fetches data
export default async function ProductPage({ params }: ProductPageProps) {
  // `params` may be a Promise; await it before reading `slug`.
  const { category: categorySlug, productSlug } = (await params) as {
    category?: string;
    productSlug?: string;
  };

  // If the route was reached without a slug, return a 404 immediately.
  if (!productSlug || !categorySlug) {
    notFound();
  }

  const product = await getProductBySlug(productSlug);

  // If no product is found, show a 404 page
  if (!product) {
    notFound();
  }

  // Determine the display category based on the URL param
  let displayCategory;

  // 1. Check for DB category (now includes Origins, Micro Lots, Blends, and Roasts)
  displayCategory = product.categories.find(
    (c) => c.category.slug === categorySlug
  )?.category;

  // 2. Fallback (shouldn't happen if URL is valid, but good for safety)
  if (!displayCategory) {
    // If the user manually typed a URL like /random-category/product-slug,
    // and the product exists but isn't in that category, we might want to 404
    // or just redirect. For now, let's 404 to be strict about structure.
    // However, to be user friendly, we could just show the product with its primary category.
    // Let's be strict to avoid duplicate content issues (SEO).
    notFound();
  }

  // Fetch related products based on the current product's roast level
  const roastCategory = product.categories.find(
    (c) => c.category.label === "Roast Level"
  )?.category;

  const relatedProducts = await getRelatedProducts(
    product.id,
    roastCategory?.slug || "medium-roast"
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
