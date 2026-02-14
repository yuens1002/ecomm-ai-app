import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://artisanroast.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Product pages
  const products = await prisma.product.findMany({
    where: { isDisabled: false },
    select: { slug: true, updatedAt: true },
  });

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Category pages
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    select: { slug: true, createdAt: true },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/${category.slug}`,
    lastModified: category.createdAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // CMS pages (published only)
  const cmsPages = await prisma.page.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  });

  const cmsPageRoutes: MetadataRoute.Sitemap = cmsPages.map((page) => ({
    url: `${baseUrl}/pages/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...cmsPageRoutes];
}
