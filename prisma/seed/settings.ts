import { PrismaClient } from "@prisma/client";

export async function seedSettings(prisma: PrismaClient) {
  console.log("  📋 Creating site settings...");

  // Category labels
  const labelRoasts = await prisma.siteSettings.upsert({
    where: { key: "label_roasts" },
    update: {},
    create: { key: "label_roasts", value: "Roasts" },
  });

  const labelOrigins = await prisma.siteSettings.upsert({
    where: { key: "label_origins" },
    update: {},
    create: { key: "label_origins", value: "Origins" },
  });

  const labelCollections = await prisma.siteSettings.upsert({
    where: { key: "label_collections" },
    update: {},
    create: { key: "label_collections", value: "Collections" },
  });

  await prisma.siteSettings.upsert({
    where: { key: "defaultCategoryLabel" },
    update: {},
    create: {
      key: "defaultCategoryLabel",
      value: labelCollections.id,
    },
  });

  // Contact and communication settings
  await prisma.siteSettings.upsert({
    where: { key: "contactEmail" },
    update: {},
    create: {
      key: "contactEmail",
      value: "onboarding@resend.dev",
    },
  });

  // Newsletter settings
  await prisma.siteSettings.upsert({
    where: { key: "newsletter_enabled" },
    update: {},
    create: {
      key: "newsletter_enabled",
      value: "true",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "newsletter_heading" },
    update: {},
    create: {
      key: "newsletter_heading",
      value: "Stay Connected",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "newsletter_description" },
    update: {},
    create: {
      key: "newsletter_description",
      value:
        "Subscribe to our newsletter for exclusive offers and coffee tips.",
    },
  });

  // Store branding
  await prisma.siteSettings.upsert({
    where: { key: "store_name" },
    update: {},
    create: {
      key: "store_name",
      value: "Artisan Roast",
    },
  });

  // App-wide location type setting
  const LOCATION_TYPE = process.env.SEED_LOCATION_TYPE || "MULTI";
  await prisma.siteSettings.upsert({
    where: { key: "app.locationType" },
    update: { value: LOCATION_TYPE },
    create: {
      key: "app.locationType",
      value: LOCATION_TYPE,
    },
  });

  console.log(`    ✓ Location type set to: ${LOCATION_TYPE}`);

  // Store content
  await prisma.siteSettings.upsert({
    where: { key: "store_tagline" },
    update: {},
    create: {
      key: "store_tagline",
      value: "Specialty coffee sourced from the world's finest origins.",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "store_description" },
    update: {},
    create: {
      key: "store_description",
      value:
        "Premium specialty coffee, carefully roasted to perfection. From single-origin beans to signature blends, discover exceptional coffee delivered to your door.",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "store_logo_url" },
    update: {},
    create: {
      key: "store_logo_url",
      value: "/logo.svg",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "store_favicon_url" },
    update: {},
    create: {
      key: "store_favicon_url",
      value: "/favicon.ico",
    },
  });

  // Marketing content settings
  await prisma.siteSettings.upsert({
    where: { key: "homepage_featured_heading" },
    update: {},
    create: {
      key: "homepage_featured_heading",
      value: "Our Small Batch Collection",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "homepage_recommendations_trending_heading" },
    update: {},
    create: {
      key: "homepage_recommendations_trending_heading",
      value: "Trending Now",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "homepage_recommendations_trending_description" },
    update: {},
    create: {
      key: "homepage_recommendations_trending_description",
      value: "Discover what other coffee lovers are enjoying",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "homepage_recommendations_personalized_heading" },
    update: {},
    create: {
      key: "homepage_recommendations_personalized_heading",
      value: "Recommended For You",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "homepage_recommendations_explore_all_text" },
    update: {},
    create: {
      key: "homepage_recommendations_explore_all_text",
      value: "Explore All Coffees",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "footer_categories_heading" },
    update: {},
    create: {
      key: "footer_categories_heading",
      value: "Coffee Selection",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "footer_quick_links_heading" },
    update: {},
    create: {
      key: "footer_quick_links_heading",
      value: "Quick Links",
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "product_related_heading" },
    update: {},
    create: {
      key: "product_related_heading",
      value: "You Might Also Like",
    },
  });

  console.log("  ✅ Site settings created");
}
