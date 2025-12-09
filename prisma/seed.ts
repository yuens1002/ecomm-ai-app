/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { config } from "dotenv";
// Ensure node-api engine is used even if env sets client/edge; set before PrismaClient loads.
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
process.env.PRISMA_GENERATE_ENGINE_TYPE = "library";
config({ path: ".env.local" });
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
process.env.PRISMA_GENERATE_ENGINE_TYPE = "library";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { Pool } from "pg";

const {
  PrismaClient,
  PurchaseType,
  BillingInterval,
  RoastLevel,
} = require("@prisma/client");

const shouldUseNeonAdapter = () => {
  const adapterEnv = process.env.DATABASE_ADAPTER?.toLowerCase();
  if (adapterEnv === "neon") return true;
  if (adapterEnv === "postgres" || adapterEnv === "standard") return false;
  return process.env.DATABASE_URL?.includes("neon.tech") ?? false;
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run seeds");
  }

  if (!shouldUseNeonAdapter()) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  neonConfig.webSocketConstructor = ws;
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
};

const prisma = createPrismaClient();

async function main() {
  console.log(`Start seeding with 30 specialty coffee products...`);

  // --- 1. Create SiteSettings for category labels ---
  console.log("Creating SiteSettings...");

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

  // Contact email for all communications
  await prisma.siteSettings.upsert({
    where: { key: "contactEmail" },
    update: {},
    create: {
      key: "contactEmail",
      value: "onboarding@resend.dev",
    },
  });

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
  // Set to "SINGLE" for single location (imageCarousel) or "MULTI" for multiple locations (locationCarousel)
  const LOCATION_TYPE = process.env.SEED_LOCATION_TYPE || "MULTI"; // "SINGLE" or "MULTI"

  await prisma.siteSettings.upsert({
    where: { key: "app.locationType" },
    update: { value: LOCATION_TYPE },
    create: {
      key: "app.locationType",
      value: LOCATION_TYPE,
    },
  });

  console.log(`✓ Location type set to: ${LOCATION_TYPE}`);

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

  // Marketing Content Settings
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

  console.log("✓ SiteSettings created");

  // --- 2. Create Categories ---
  const catBlends = await prisma.category.upsert({
    where: { slug: "blends" },
    update: {},
    create: {
      name: "Blend",
      slug: "blends",
      labelSettingId: labelCollections.id,
      order: 20,
    },
  });

  const catSingleOrigin = await prisma.category.upsert({
    where: { slug: "single-origin" },
    update: {},
    create: {
      name: "Single Origin",
      slug: "single-origin",
      labelSettingId: labelCollections.id,
      order: 22,
    },
  });

  const catMicroLot = await prisma.category.upsert({
    where: { slug: "micro-lot" },
    update: {},
    create: {
      name: "Micro Lot",
      slug: "micro-lot",
      labelSettingId: labelCollections.id,
      order: 21,
    },
  });

  const catDark = await prisma.category.upsert({
    where: { slug: "dark-roast" },
    update: {},
    create: {
      name: "Dark Roast",
      slug: "dark-roast",
      labelSettingId: labelRoasts.id,
      order: 3,
    },
  });

  const catMedium = await prisma.category.upsert({
    where: { slug: "medium-roast" },
    update: {},
    create: {
      name: "Medium Roast",
      slug: "medium-roast",
      labelSettingId: labelRoasts.id,
      order: 2,
    },
  });

  const catLight = await prisma.category.upsert({
    where: { slug: "light-roast" },
    update: {},
    create: {
      name: "Light Roast",
      slug: "light-roast",
      labelSettingId: labelRoasts.id,
      order: 1,
    },
  });

  // Origin Categories
  const origins = [
    "Ethiopia",
    "Kenya",
    "Colombia",
    "Guatemala",
    "Costa Rica",
    "Brazil",
    "Indonesia",
    "Papua New Guinea",
    "Honduras",
    "Mexico",
    "Peru",
    "Nicaragua",
    "El Salvador",
    "Rwanda",
    "Burundi",
    "Tanzania",
    "Panama",
    "Bolivia",
    "Yemen",
    "India",
    "Hawaii",
  ];

  const originCategories: Record<
    string,
    { id: string; name: string; slug: string }
  > = {};
  for (let i = 0; i < origins.length; i++) {
    const origin = origins[i];
    const slug = origin.toLowerCase().replace(/\s+/g, "-");
    originCategories[origin] = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name: origin,
        slug,
        labelSettingId: labelOrigins.id,
        order: 100 + i,
      },
    });
  }

  console.log("Categories created/verified.");

  // --- 2. Define 30 Products ---

  const coffeeData = [
    // === ESPRESSO & DARK ROASTS (6 products) ===

    // 1. Midnight Espresso Blend
    {
      product: {
        name: "Midnight Espresso Blend",
        slug: "midnight-espresso-blend",
        description:
          "Our signature espresso blend crafted for intense flavor and creamy body. A harmonious mix of Brazilian, Colombian, and Indonesian beans creates layers of dark chocolate, toasted hazelnut, and caramelized sugar. Perfect for straight shots or milk-based drinks.",
        origin: ["Brazil", "Colombia", "Indonesia"],
        tastingNotes: ["Dark Chocolate", "Toasted Hazelnut", "Caramel"],
        isOrganic: false,
        isFeatured: true,
        featuredOrder: 1,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/1A1110/FFFFFF.png?text=Midnight+Espresso",
              altText: "Midnight Espresso Blend bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 150,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 2200 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2090,
                    // // discountMessage: "Save 5%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 2,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 1980,
                    // // discountMessage: "Save 10%",
                    billingInterval: BillingInterval.MONTH,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
            {
              name: "2lb Bag",
              weightInGrams: 907,
              stockQuantity: 75,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 5600 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 5320,
                    // // discountMessage: "Save 5%",
                    billingInterval: BillingInterval.MONTH,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catBlends.id, isPrimary: true },
        { categoryId: catDark.id, isPrimary: false },
      ],
    },

    // 2. Italian Roast
    {
      product: {
        name: "Italian Roast",
        slug: "italian-roast",
        description:
          "Bold, smoky, and intensely aromatic. This traditional dark roast delivers notes of bittersweet chocolate, roasted almonds, and a hint of smokiness. Ideal for those who love a powerful, full-bodied cup.",
        origin: ["Brazil", "Guatemala"],
        tastingNotes: ["Bittersweet Chocolate", "Roasted Almond", "Smoky"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/2B1810/FFFFFF.png?text=Italian+Roast",
              altText: "Italian Roast bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 120,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2100 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catBlends.id, isPrimary: true },
        { categoryId: catDark.id, isPrimary: false },
      ],
    },

    // 3. Sumatra Mandheling
    {
      product: {
        name: "Sumatra Mandheling",
        slug: "sumatra-mandheling",
        description:
          "A classic Indonesian single origin with a full body and low acidity. Earthy, herbaceous notes combine with dark chocolate and cedar for a distinctively complex cup.",
        origin: ["Indonesia"],
        tastingNotes: ["Earthy", "Dark Chocolate", "Cedar"],
        isOrganic: true,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/3A2416/FFFFFF.png?text=Sumatra",
              altText: "Sumatra Mandheling bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 85,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2400 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catDark.id, isPrimary: false },
      ],
    },

    // 4. French Roast
    {
      product: {
        name: "French Roast",
        slug: "french-roast",
        description:
          "A deeply roasted blend with intense, bold flavor. Pronounced notes of dark chocolate, charred wood, and a velvety smooth finish. For those who crave the darkest roasts.",
        origin: ["Colombia", "Brazil"],
        tastingNotes: ["Dark Chocolate", "Charred Wood", "Smooth"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/1C1410/FFFFFF.png?text=French+Roast",
              altText: "French Roast bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 95,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2050 }],
              },
            },
            {
              name: "5lb Bulk Bag",
              weightInGrams: 2268,
              stockQuantity: 25,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 12500 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catBlends.id, isPrimary: true },
        { categoryId: catDark.id, isPrimary: false },
      ],
    },

    // 5. Papua New Guinea Sigri Estate
    {
      product: {
        name: "Papua New Guinea Sigri Estate",
        slug: "papua-new-guinea-sigri",
        description:
          "A rare gem from the Sigri Estate in PNG's highlands. Full-bodied with rich, earthy undertones, complemented by dark berry and cocoa notes. A sophisticated dark roast for true coffee connoisseurs.",
        origin: ["Papua New Guinea"],
        tastingNotes: ["Dark Berry", "Cocoa", "Earthy"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/3D2820/FFFFFF.png?text=PNG+Sigri",
              altText: "Papua New Guinea Sigri bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 45,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2650 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 6. Decaf Colombian
    {
      product: {
        name: "Decaf Colombian",
        slug: "decaf-colombian",
        description:
          "All the flavor, none of the caffeine. Swiss water processed Colombian beans deliver smooth, balanced notes of milk chocolate, toasted nuts, and mild caramel sweetness.",
        origin: ["Colombia"],
        tastingNotes: ["Milk Chocolate", "Toasted Nuts", "Caramel"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/4A3426/FFFFFF.png?text=Decaf+Colombian",
              altText: "Decaf Colombian bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 110,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 2300 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2185,
                    // discountMessage: "Save 5%",
                    billingInterval: BillingInterval.MONTH,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catDark.id, isPrimary: false },
      ],
    },

    // === MEDIUM ROASTS (10 products) ===

    // 7. Breakfast Blend
    {
      product: {
        name: "Breakfast Blend",
        slug: "breakfast-blend",
        description:
          "Start your day right with this perfectly balanced blend. Smooth and approachable, with notes of honey, roasted almonds, and a bright citrus finish. The ideal morning companion.",
        origin: ["Colombia", "Guatemala", "Costa Rica"],
        tastingNotes: ["Honey", "Roasted Almond", "Citrus"],
        isOrganic: false,
        isFeatured: true,
        featuredOrder: 2,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/8B5A3C/FFFFFF.png?text=Breakfast+Blend",
              altText: "Breakfast Blend bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 180,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 1950 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 1850,
                    // // discountMessage: "Save 5%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 1,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 1755,
                    // // discountMessage: "Save 10%",
                    billingInterval: BillingInterval.MONTH,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
            {
              name: "2lb Bag",
              weightInGrams: 907,
              stockQuantity: 90,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 5000 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 4750,
                    // // discountMessage: "Save 5%",
                    billingInterval: BillingInterval.MONTH,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catBlends.id, isPrimary: true },
        { categoryId: catMedium.id, isPrimary: false },
      ],
    },

    // 8. Colombian Supremo
    {
      product: {
        name: "Colombian Supremo",
        slug: "colombian-supremo",
        description:
          "A classic Colombian single origin showcasing the best of what this renowned region offers. Well-balanced with medium body, featuring notes of caramel, cocoa, and a pleasant, lingering sweetness.",
        origin: ["Colombia"],
        tastingNotes: ["Caramel", "Cocoa", "Sweet"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/7A5230/FFFFFF.png?text=Colombian",
              altText: "Colombian Supremo bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 130,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2100 }],
              },
            },
            {
              name: "2lb Bag",
              weightInGrams: 907,
              stockQuantity: 65,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 5400 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMedium.id, isPrimary: false },
      ],
    },

    // 9. Guatemalan Antigua
    {
      product: {
        name: "Guatemalan Antigua",
        slug: "guatemalan-antigua",
        description:
          "Grown in the volcanic soil of Antigua, this coffee offers exceptional complexity. Rich body with notes of dark fruit, milk chocolate, and a subtle smokiness that lingers.",
        origin: ["Guatemala"],
        tastingNotes: ["Dark Fruit", "Milk Chocolate", "Smoky"],
        isOrganic: true,
        isFeatured: true,
        featuredOrder: 3,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/6B4423/FFFFFF.png?text=Guatemala",
              altText: "Guatemalan Antigua bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 100,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 2350 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2230,
                    // // discountMessage: "Save 5%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 2,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2115,
                    // // discountMessage: "Save 10%",
                    billingInterval: BillingInterval.MONTH,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMedium.id, isPrimary: false },
      ],
    },

    // 10. Costa Rica Tarrazú
    {
      product: {
        name: "Costa Rica Tarrazú",
        slug: "costa-rica-tarrazu",
        description:
          "From the famous Tarrazú region, this coffee is clean, bright, and perfectly balanced. Expect flavors of brown sugar, stone fruit, and a crisp, refreshing finish.",
        origin: ["Costa Rica"],
        tastingNotes: ["Brown Sugar", "Stone Fruit", "Crisp"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/8A5C3A/FFFFFF.png?text=Costa+Rica",
              altText: "Costa Rica Tarrazú bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 90,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2250 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMedium.id, isPrimary: false },
      ],
    },

    // 11. Brazil Santos
    {
      product: {
        name: "Brazil Santos",
        slug: "brazil-santos",
        description:
          "A smooth, easy-drinking Brazilian coffee with low acidity. Nutty, chocolaty, and slightly sweet—perfect for everyday drinking and cold brew applications.",
        origin: ["Brazil"],
        tastingNotes: ["Nutty", "Chocolate", "Low Acidity"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/9B6B47/FFFFFF.png?text=Brazil+Santos",
              altText: "Brazil Santos bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 140,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 1950 }],
              },
            },
            {
              name: "5lb Bulk Bag",
              weightInGrams: 2268,
              stockQuantity: 40,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 11500 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMedium.id, isPrimary: false },
      ],
    },

    // 12. Honduras Marcala
    {
      product: {
        name: "Honduras Marcala",
        slug: "honduras-marcala",
        description:
          "A delightful Honduran coffee from the Marcala region. Balanced and sweet with notes of toffee, red apple, and a hint of citrus zest.",
        origin: ["Honduras"],
        tastingNotes: ["Toffee", "Red Apple", "Citrus Zest"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/7E5835/FFFFFF.png?text=Honduras",
              altText: "Honduras Marcala bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 70,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2150 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMedium.id, isPrimary: false },
      ],
    },

    // 13. Mexican Altura
    {
      product: {
        name: "Mexican Altura",
        slug: "mexican-altura",
        description:
          "From Mexico's high-altitude regions, this coffee delivers a light body with bright acidity. Features notes of cocoa, roasted nuts, and a gentle spice finish.",
        origin: ["Mexico"],
        tastingNotes: ["Cocoa", "Roasted Nuts", "Spice"],
        isOrganic: true,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/8E6240/FFFFFF.png?text=Mexican+Altura",
              altText: "Mexican Altura bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 80,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2200 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMedium.id, isPrimary: false },
      ],
    },

    // 14. Peruvian Organic
    {
      product: {
        name: "Peruvian Organic",
        slug: "peruvian-organic",
        description:
          "Certified organic beans from Peru's finest estates. Smooth and mellow with notes of vanilla, caramel, and a subtle floral undertone.",
        origin: ["Peru"],
        tastingNotes: ["Vanilla", "Caramel", "Floral"],
        isOrganic: true,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/8A5E3C/FFFFFF.png?text=Peruvian+Organic",
              altText: "Peruvian Organic bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 95,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 2300 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2185,
                    // discountMessage: "Save 5%",
                    billingInterval: BillingInterval.MONTH,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMedium.id, isPrimary: false },
      ],
    },

    // 15. Nicaraguan SHG
    {
      product: {
        name: "Nicaraguan SHG",
        slug: "nicaraguan-shg",
        description:
          "Strictly High Grown beans from Nicaragua's mountainous regions. Balanced cup with notes of milk chocolate, orange marmalade, and a smooth, creamy finish.",
        origin: ["Nicaragua"],
        tastingNotes: ["Milk Chocolate", "Orange Marmalade", "Creamy"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/7C5638/FFFFFF.png?text=Nicaragua",
              altText: "Nicaraguan SHG bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 75,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2250 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMedium.id, isPrimary: false },
      ],
    },

    // 16. El Salvador Pacamara
    {
      product: {
        name: "El Salvador Pacamara",
        slug: "el-salvador-pacamara",
        description:
          "A unique hybrid variety from El Salvador. Large beans produce a complex cup with notes of tropical fruit, honey, and a wine-like acidity.",
        origin: ["El Salvador"],
        tastingNotes: ["Tropical Fruit", "Honey", "Wine-like"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/8D6142/FFFFFF.png?text=El+Salvador",
              altText: "El Salvador Pacamara bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 50,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2550 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // === LIGHT ROASTS (14 products) ===

    // 17. Ethiopian Yirgacheffe
    {
      product: {
        name: "Ethiopian Yirgacheffe",
        slug: "ethiopian-yirgacheffe",
        description:
          "The crown jewel of Ethiopian coffees. Delicate and tea-like with pronounced floral notes, bright lemon acidity, and hints of bergamot. A must-try for light roast enthusiasts.",
        origin: ["Ethiopia"],
        tastingNotes: ["Floral", "Lemon", "Bergamot"],
        isOrganic: true,
        isFeatured: true,
        featuredOrder: 4,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/B8956A/FFFFFF.png?text=Yirgacheffe",
              altText: "Ethiopian Yirgacheffe bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 110,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 2450 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2330,
                    // // discountMessage: "Save 5%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 2,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2205,
                    // // discountMessage: "Save 10%",
                    billingInterval: BillingInterval.MONTH,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catLight.id, isPrimary: false },
      ],
    },

    // 18. Kenya AA
    {
      product: {
        name: "Kenya AA",
        slug: "kenya-aa",
        description:
          "Bold, bright, and bursting with flavor. This top-grade Kenyan coffee delivers intense notes of blackcurrant, grapefruit, and tomato sweetness with a syrupy body.",
        origin: ["Kenya"],
        tastingNotes: ["Blackcurrant", "Grapefruit", "Tomato"],
        isOrganic: false,
        isFeatured: true,
        featuredOrder: 5,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/A67C52/FFFFFF.png?text=Kenya+AA",
              altText: "Kenya AA bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 85,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2650 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 19. Ethiopian Sidamo
    {
      product: {
        name: "Ethiopian Sidamo",
        slug: "ethiopian-sidamo",
        description:
          "From the birthplace of coffee, this Sidamo offers a complex profile with notes of blueberry, jasmine, and dark chocolate. Sweet and aromatic.",
        origin: ["Ethiopia"],
        tastingNotes: ["Blueberry", "Jasmine", "Dark Chocolate"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/B89968/FFFFFF.png?text=Sidamo",
              altText: "Ethiopian Sidamo bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 90,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2400 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catLight.id, isPrimary: false },
      ],
    },

    // 20. Rwanda Bourbon
    {
      product: {
        name: "Rwanda Bourbon",
        slug: "rwanda-bourbon",
        description:
          "An exceptional African coffee with a silky body. Features bright notes of red fruit, caramel, and a hint of floral sweetness.",
        origin: ["Rwanda"],
        tastingNotes: ["Red Fruit", "Caramel", "Floral"],
        isOrganic: true,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/AA7F5A/FFFFFF.png?text=Rwanda",
              altText: "Rwanda Bourbon bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 60,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2500 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 21. Burundi Kayanza
    {
      product: {
        name: "Burundi Kayanza",
        slug: "burundi-kayanza",
        description:
          "A gem from Burundi's Kayanza region. Clean and sweet with notes of cherry, cocoa nibs, and a pleasant tangy finish.",
        origin: ["Burundi"],
        tastingNotes: ["Cherry", "Cocoa Nibs", "Tangy"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/A8825E/FFFFFF.png?text=Burundi",
              altText: "Burundi Kayanza bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 55,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2450 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 22. Tanzania Peaberry
    {
      product: {
        name: "Tanzania Peaberry",
        slug: "tanzania-peaberry",
        description:
          "Rare peaberry beans from the slopes of Mount Kilimanjaro. Bright acidity with notes of black currant, citrus, and a winey complexity.",
        origin: ["Tanzania"],
        tastingNotes: ["Black Currant", "Citrus", "Winey"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/AF8660/FFFFFF.png?text=Tanzania",
              altText: "Tanzania Peaberry bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 45,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2600 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 23. Panama Geisha
    {
      product: {
        name: "Panama Geisha",
        slug: "panama-geisha",
        description:
          "One of the world's most sought-after coffees. Exquisite and delicate with pronounced jasmine, tropical fruit, and honey notes. A truly luxurious experience.",
        origin: ["Panama"],
        tastingNotes: ["Jasmine", "Tropical Fruit", "Honey"],
        isOrganic: true,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/C9A676/FFFFFF.png?text=Panama+Geisha",
              altText: "Panama Geisha bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 25,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 4500 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 24. Colombia Geisha
    {
      product: {
        name: "Colombia Geisha",
        slug: "colombia-geisha",
        description:
          "An exceptional Geisha variety grown in Colombia. Floral, sweet, and complex with notes of peach, lavender, and brown sugar.",
        origin: ["Colombia"],
        tastingNotes: ["Peach", "Lavender", "Brown Sugar"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/BDA279/FFFFFF.png?text=Colombia+Geisha",
              altText: "Colombia Geisha bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 30,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 3800 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 25. Costa Rica Honey Process
    {
      product: {
        name: "Costa Rica Honey Process",
        slug: "costa-rica-honey-process",
        description:
          "A unique honey-processed coffee from Costa Rica. Sweet and fruity with notes of apricot, honey, and a syrupy mouthfeel.",
        origin: ["Costa Rica"],
        tastingNotes: ["Apricot", "Honey", "Syrupy"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/B8986E/FFFFFF.png?text=Honey+Process",
              altText: "Costa Rica Honey Process bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 65,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2550 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 26. Guatemala Huehuetenango
    {
      product: {
        name: "Guatemala Huehuetenango",
        slug: "guatemala-huehuetenango",
        description:
          "From Guatemala's highest and most remote region. Delicate and refined with notes of apple, almond, and a bright, clean finish.",
        origin: ["Guatemala"],
        tastingNotes: ["Apple", "Almond", "Clean"],
        isOrganic: true,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/B39471/FFFFFF.png?text=Huehuetenango",
              altText: "Guatemala Huehuetenango bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 70,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2400 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catLight.id, isPrimary: false },
      ],
    },

    // 27. Bolivia Caranavi
    {
      product: {
        name: "Bolivia Caranavi",
        slug: "bolivia-caranavi",
        description:
          "A rare find from Bolivia's Yungas region. Sweet and delicate with notes of milk chocolate, orange, and a silky body.",
        origin: ["Bolivia"],
        tastingNotes: ["Milk Chocolate", "Orange", "Silky"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/B5906C/FFFFFF.png?text=Bolivia",
              altText: "Bolivia Caranavi bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 40,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2450 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 28. Yemen Mocha
    {
      product: {
        name: "Yemen Mocha",
        slug: "yemen-mocha",
        description:
          "An ancient and legendary coffee with wild, complex flavors. Notes of dried fruit, chocolate, spice, and a winey acidity. For the adventurous palate.",
        origin: ["Yemen"],
        tastingNotes: ["Dried Fruit", "Chocolate", "Spice"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/C0A078/FFFFFF.png?text=Yemen+Mocha",
              altText: "Yemen Mocha bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 20,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 5200 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 29. India Monsooned Malabar
    {
      product: {
        name: "India Monsooned Malabar",
        slug: "india-monsooned-malabar",
        description:
          "A unique monsooned coffee from India's Malabar coast. Low acidity with earthy, musty notes and hints of tobacco and spice. An acquired taste for the curious.",
        origin: ["India"],
        tastingNotes: ["Earthy", "Tobacco", "Spice"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/A88C67/FFFFFF.png?text=Monsooned+Malabar",
              altText: "India Monsooned Malabar bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "12oz Bag",
              weightInGrams: 340,
              stockQuantity: 50,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2350 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 30. Hawaiian Kona
    {
      product: {
        name: "Hawaiian Kona",
        slug: "hawaiian-kona",
        description:
          "Premium beans from Hawaii's Kona district. Smooth, balanced, and aromatic with notes of brown sugar, macadamia nut, and a bright, clean finish. A rare treat.",
        origin: ["Hawaii"],
        tastingNotes: ["Brown Sugar", "Macadamia Nut", "Clean"],
        isOrganic: false,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/D4AF7A/FFFFFF.png?text=Hawaiian+Kona",
              altText: "Hawaiian Kona bag",
              order: 1,
            },
          ],
        },
        variants: {
          create: [
            {
              name: "8oz Bag",
              weightInGrams: 227,
              stockQuantity: 35,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 4800 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },
  ];

  // --- 3. Loop and upsert products ---
  for (const item of coffeeData) {
    const { product: productData, categories: categoryLinks } = item;

    // Determine roast level from old categories
    let roastLevel = RoastLevel.MEDIUM; // Default
    if (categoryLinks.some((l) => l.categoryId === catDark.id)) {
      roastLevel = RoastLevel.DARK;
    } else if (categoryLinks.some((l) => l.categoryId === catLight.id)) {
      roastLevel = RoastLevel.LIGHT;
    }

    // Determine new categories based on origin
    const newCategories: Array<{ categoryId: string; isPrimary: boolean }> = [];
    const origins = productData.origin;
    const isMicroLot = categoryLinks.some(
      (l) => l.categoryId === catMicroLot.id
    );

    if (origins.length === 1) {
      // Single origin - use origin category as primary
      const originCategory = originCategories[origins[0]];
      if (originCategory) {
        newCategories.push({ categoryId: originCategory.id, isPrimary: true });
      } else {
        // Fallback to single-origin collection
        newCategories.push({ categoryId: catSingleOrigin.id, isPrimary: true });
      }
    } else {
      // Multiple origins - use blend as primary
      newCategories.push({ categoryId: catBlends.id, isPrimary: true });
    }

    // Add roast level as secondary
    if (roastLevel === RoastLevel.DARK) {
      newCategories.push({ categoryId: catDark.id, isPrimary: false });
    } else if (roastLevel === RoastLevel.LIGHT) {
      newCategories.push({ categoryId: catLight.id, isPrimary: false });
    } else {
      newCategories.push({ categoryId: catMedium.id, isPrimary: false });
    }

    // Add micro lot if applicable
    if (isMicroLot) {
      newCategories.push({ categoryId: catMicroLot.id, isPrimary: false });
    }

    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        name: productData.name,
        description: productData.description,
        origin: productData.origin,
        tastingNotes: productData.tastingNotes,
        isOrganic: productData.isOrganic,
        roastLevel: roastLevel,
        isFeatured: productData.isFeatured,
        featuredOrder: productData.featuredOrder,
        // We do not update images/variants here to avoid breaking FK constraints with Orders
      },
      create: {
        ...productData,
        roastLevel: roastLevel,
      },
    });

    await prisma.categoriesOnProducts.deleteMany({
      where: { productId: product.id },
    });

    await prisma.categoriesOnProducts.createMany({
      data: newCategories.map((cat) => ({
        ...cat,
        productId: product.id,
      })),
    });

    console.log(`✓ ${product.name}`);
  }

  console.log(`\n✅ Seeding finished: 30 specialty coffee products created!`);

  // --- 4. Create synthetic demo users ---
  console.log("\nCreating demo users...");

  const demoUsers = [
    {
      email: "demo@artisanroast.com",
      name: "Demo User",
      isAdmin: false,
    },
    {
      email: "admin@artisanroast.com",
      name: "Admin User",
      isAdmin: true,
    },
    {
      email: "sarah.coffee@example.com",
      name: "Sarah Johnson",
      isAdmin: false,
    },
    {
      email: "mike.espresso@example.com",
      name: "Mike Chen",
      isAdmin: false,
    },
    {
      email: "emily.brew@example.com",
      name: "Emily Rodriguez",
      isAdmin: false,
    },
  ];

  for (const userData of demoUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`✓ ${userData.name} (${userData.email})`);
  }

  console.log("\nCreating CMS pages...");

  // About Page (Block-based using two-column layout)
  const aboutPage = await prisma.page.upsert({
    where: { slug: "about" },
    update: {},
    create: {
      slug: "about",
      title: "About Us",
      type: "ABOUT",
      heroImage: null,
      content: "",
      metaDescription:
        "Learn about our specialty coffee roastery, our values, and our commitment to quality.",
      showInFooter: true,
      footerOrder: 1,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
    },
  });

  // Delete existing blocks for About page before creating new ones
  await prisma.block.deleteMany({
    where: { pageId: aboutPage.id },
  });

  // Hero block for About page
  await prisma.block.create({
    data: {
      pageId: aboutPage.id,
      type: "hero",
      order: 0,
      isDeleted: false,
      content: {
        heading: "Our Story",
        imageUrl: "https://placehold.co/1920x800/8B4513/FFF?text=Our+Story",
        imageAlt: "Artisan Roast coffee roastery",
        caption: "Crafting exceptional coffee experiences since 2015",
      },
    },
  });

  // Stat blocks for About page (3 required)
  const aboutStats = [
    { emoji: "☕", value: "250+", label: "Cups Served Daily" },
    { emoji: "🌍", value: "12", label: "Origin Countries" },
    { emoji: "⭐", value: "4.9", label: "Customer Rating" },
  ];

  for (let i = 0; i < aboutStats.length; i++) {
    await prisma.block.create({
      data: {
        pageId: aboutPage.id,
        type: "stat",
        order: i + 1,
        isDeleted: false,
        content: aboutStats[i],
      },
    });
  }

  // Pull Quote block for About page
  await prisma.block.create({
    data: {
      pageId: aboutPage.id,
      type: "pullQuote",
      order: 4,
      isDeleted: false,
      content: {
        text: "Every cup tells a story — from the hands that picked the cherries to the moment it reaches yours.",
        author: "Our Founding Philosophy",
      },
    },
  });

  // Rich Text block for About page
  await prisma.block.create({
    data: {
      pageId: aboutPage.id,
      type: "richText",
      order: 5,
      isDeleted: false,
      content: {
        html: `
          <h2>Our Journey</h2>
          <p>What started as a small passion project in a garage has grown into a beloved specialty coffee roastery. We source our beans directly from farmers across 12 countries, ensuring fair trade practices and exceptional quality at every step.</p>
          
          <h3>Our Commitment</h3>
          <p>Quality, sustainability, and community are at the heart of everything we do. We roast in small batches to bring out the unique flavor profiles of each origin, and we're proud to support the farmers and communities who make our coffee possible.</p>
          
          <h3>Visit Us</h3>
          <p>Stop by our roastery to experience the art of coffee roasting firsthand. Our team is always happy to share a cup and talk about what makes specialty coffee special.</p>
        `,
      },
    },
  });

  console.log("✓ About page with blocks (hero, 3 stats, pullQuote, richText)");

  // Brewing Guides (Parent Page)
  const _brewingGuides = await prisma.page.upsert({
    where: { slug: "brewing" },
    update: {},
    create: {
      slug: "brewing",
      title: "Brewing Guides",
      heroImage: null,
      content: `
        <h2>Master the Art of Coffee Brewing</h2>
        <p>Explore our comprehensive brewing guides to make the perfect cup of coffee at home.</p>
        <p>Choose your preferred brewing method below to get started.</p>
      `,
      metaDescription:
        "Learn how to brew perfect coffee with our step-by-step guides for various brewing methods.",
      showInFooter: true,
      footerOrder: 2,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
    },
  });
  console.log("✓ Brewing Guides (parent page)");

  // Café Location Page with Carousel and Location Blocks
  const cafePage = await prisma.page.upsert({
    where: { slug: "cafe" },
    update: {},
    create: {
      slug: "cafe",
      title: LOCATION_TYPE === "SINGLE" ? "Visit Our Café" : "Visit Our Cafés",
      type: "CAFE",
      heroImage: null,
      content: "",
      metaDescription:
        LOCATION_TYPE === "SINGLE"
          ? "Visit our café for freshly roasted specialty coffee. Find our location, hours, and what to expect."
          : "Visit our café locations for freshly roasted specialty coffee. Find our locations, hours, and what to expect.",
      showInFooter: true,
      footerOrder: 3,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
    },
  });

  // Create carousel block based on location type
  if (LOCATION_TYPE === "SINGLE") {
    // SINGLE location: imageCarousel (atmosphere images only)
    // Using placeholder images for demo - replace with actual uploads in production
    await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "imageCarousel",
        order: 0,
        isDeleted: false,
        content: {
          slides: [
            {
              url: "https://placehold.co/800x600/8B4513/FFF?text=Cozy+Interior",
              alt: "Cozy interior seating with natural light",
            },
            {
              url: "https://placehold.co/800x600/654321/FFF?text=Espresso+Bar",
              alt: "Espresso bar with barista at work",
            },
            {
              url: "https://placehold.co/800x600/A0522D/FFF?text=Outdoor+Patio",
              alt: "Outdoor patio seating area",
            },
            {
              url: "https://placehold.co/800x600/8B4513/FFF?text=Brewing+Station",
              alt: "Coffee brewing station and equipment",
            },
            {
              url: "https://placehold.co/800x600/654321/FFF?text=Lounge+Area",
              alt: "Comfortable lounge area for working",
            },
          ],
          autoScroll: true,
          intervalSeconds: 5,
        },
      },
    });

    // SINGLE location: One location block with full details
    await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "location",
        order: 1,
        isDeleted: false,
        content: {
          name: "Artisan Roast Café",
          address: "427 MARKET STREET\nSAN FRANCISCO, CA 94105",
          phone: "(415) 555-0142",
          googleMapsUrl:
            "https://maps.google.com/?q=427+Market+St+San+Francisco+CA+94105",
          description:
            "Welcome to our specialty coffee café in the heart of downtown. Features a full espresso bar, pour-over station, and rotating single-origin offerings. Free WiFi and plenty of seating for remote work or casual meetings.",
          schedule: [
            { day: "Monday - Friday", hours: "6:30AM - 7PM" },
            { day: "Saturday - Sunday", hours: "7AM - 6PM" },
          ],
          images: [
            {
              url: "https://placehold.co/600x400/8B4513/FFF?text=Cafe+Exterior",
              alt: "Café exterior storefront",
            },
            {
              url: "https://placehold.co/600x400/654321/FFF?text=Interior+Seating",
              alt: "Interior seating area",
            },
            {
              url: "https://placehold.co/600x400/A0522D/FFF?text=Espresso+Bar",
              alt: "Espresso bar close-up",
            },
          ],
        },
      },
    });

    await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "richText",
        order: 2,
        isDeleted: false,
        content: {
          html: `
            <h2>What to Expect</h2>
            <p>Our café features freshly roasted beans from our local roastery, expert baristas, and a welcoming atmosphere. Whether you're grabbing a quick espresso or settling in for the afternoon, we're here to fuel your day with exceptional coffee.</p>
            
            <h3>Ordering & Amenities</h3>
            <ul>
              <li>Order at the counter or use our mobile app for pickup</li>
              <li>Free WiFi throughout the café</li>
              <li>Oat, almond, and whole milk alternatives available</li>
              <li>Loyalty rewards program - earn free drinks</li>
              <li>Private event space available for meetings and gatherings</li>
            </ul>
          `,
        },
      },
    });

    console.log("✓ Café page with imageCarousel and single location (SINGLE)");
  } else {
    // MULTI location: locationCarousel with location previews
    // Note: locationBlockId will need to be updated after location blocks are created
    // Using placeholder images for demo - replace with actual uploads in production
    const cafeCarousel = await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "locationCarousel",
        order: 0,
        isDeleted: false,
        content: {
          slides: [
            {
              url: "https://placehold.co/800x600/654321/FFF?text=Market+Street",
              alt: "Market Street location with large windows",
              title: "Market Street",
              description: "Our flagship location in the heart of the city",
              locationBlockId: "temp-1",
            },
            {
              url: "https://placehold.co/800x600/8B4513/FFF?text=Pearl+Street",
              alt: "Pearl Street location interior seating area",
              title: "Pearl Street",
              description: "Cozy neighborhood spot with fresh pastries daily",
              locationBlockId: "temp-2",
            },
            {
              url: "https://placehold.co/800x600/A0522D/FFF?text=Hawthorne+Blvd",
              alt: "Hawthorne Boulevard cafe with outdoor seating",
              title: "Hawthorne Boulevard",
              description:
                "Relaxed atmosphere perfect for working or meeting friends",
              locationBlockId: "temp-3",
            },
          ],
          autoScroll: true,
          intervalSeconds: 5,
        },
      },
    }); // Create Location Blocks for Cafe Page
    const roastworksBlock = await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "location",
        order: 1,
        isDeleted: false,
        content: {
          name: "Market Street",
          address: "427 MARKET STREET\nSAN FRANCISCO, CA 94105",
          phone: "(415) 555-0142",
          googleMapsUrl:
            "https://maps.google.com/?q=427+Market+St+San+Francisco+CA+94105",
          description:
            "Our flagship location in the heart of downtown. Features a full espresso bar, pour-over station, and rotating single-origin offerings. Free WiFi and plenty of seating for remote work or casual meetings.",
          schedule: [
            { day: "Monday - Friday", hours: "6:30AM - 7PM" },
            { day: "Saturday - Sunday", hours: "7AM - 6PM" },
          ],
          images: [
            {
              url: "https://placehold.co/600x400/654321/FFF?text=Market+St+Exterior",
              alt: "Market Street exterior",
            },
            {
              url: "https://placehold.co/600x400/8B4513/FFF?text=Market+St+Interior",
              alt: "Interior seating area",
            },
            {
              url: "https://placehold.co/600x400/A0522D/FFF?text=Market+St+Bar",
              alt: "Espresso bar",
            },
          ],
        },
      },
    });

    const dailyGrindBlock = await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "location",
        order: 2,
        isDeleted: false,
        content: {
          name: "Pearl Street",
          address: "1523 PEARL STREET\nBOULDER, CO 80302",
          phone: "(303) 555-0198",
          googleMapsUrl:
            "https://maps.google.com/?q=1523+Pearl+St+Boulder+CO+80302",
          description:
            "Cozy neighborhood café known for our house-baked pastries and seasonal coffee selections. Dog-friendly patio seating available. Local art on display monthly.",
          schedule: [
            { day: "Monday - Friday", hours: "6AM - 6PM" },
            { day: "Saturday - Sunday", hours: "7AM - 5PM" },
          ],
          images: [
            {
              url: "https://placehold.co/600x400/8B4513/FFF?text=Pearl+St+Storefront",
              alt: "Pearl Street storefront",
            },
            {
              url: "https://placehold.co/600x400/654321/FFF?text=Pearl+St+Pastries",
              alt: "Pastry display case",
            },
            {
              url: "https://placehold.co/600x400/A0522D/FFF?text=Pearl+St+Patio",
              alt: "Outdoor patio seating",
            },
          ],
        },
      },
    });

    const beanLeafBlock = await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "location",
        order: 3,
        isDeleted: false,
        content: {
          name: "Hawthorne Boulevard",
          address: "812 SE HAWTHORNE BLVD\nPORTLAND, OR 97214",
          phone: "(503) 555-0276",
          googleMapsUrl:
            "https://maps.google.com/?q=812+SE+Hawthorne+Blvd+Portland+OR+97214",
          description:
            "Relaxed atmosphere perfect for studying, working, or catching up with friends. Specialty tea selection alongside our coffee menu. Live acoustic music on Friday evenings.",
          schedule: [
            { day: "Monday - Thursday", hours: "7AM - 8PM" },
            { day: "Friday", hours: "7AM - 10PM" },
            { day: "Saturday - Sunday", hours: "8AM - 8PM" },
          ],
          images: [
            {
              url: "https://placehold.co/600x400/A0522D/FFF?text=Hawthorne+Entrance",
              alt: "Hawthorne Boulevard entrance",
            },
            {
              url: "https://placehold.co/600x400/8B4513/FFF?text=Hawthorne+Seating",
              alt: "Comfortable seating area",
            },
            {
              url: "https://placehold.co/600x400/654321/FFF?text=Hawthorne+Bar",
              alt: "Coffee and tea bar",
            },
          ],
        },
      },
    });

    await prisma.block.create({
      data: {
        pageId: cafePage.id,
        type: "richText",
        order: 4,
        isDeleted: false,
        content: {
          html: `
          <h2>What to Expect</h2>
          <p>All of our locations feature freshly roasted beans from our local roastery, expert baristas, and a welcoming atmosphere. Whether you're grabbing a quick espresso or settling in for the afternoon, we're here to fuel your day with exceptional coffee.</p>
          
          <h3>Ordering & Amenities</h3>
          <ul>
            <li>Order at the counter or use our mobile app for pickup</li>
            <li>Free WiFi at all locations</li>
            <li>Oat, almond, and whole milk alternatives available</li>
            <li>Loyalty rewards program - earn free drinks</li>
            <li>Private event space available (Downtown location only)</li>
          </ul>
        `,
        },
      },
    });

    // Update carousel slides with actual location block IDs
    await prisma.block.update({
      where: { id: cafeCarousel.id },
      data: {
        content: {
          slides: [
            {
              url: "https://placehold.co/800x600/654321/FFF?text=Market+Street",
              alt: "Market Street location with large windows",
              title: "Market Street",
              description: "Our flagship location in the heart of the city",
              locationBlockId: roastworksBlock.id,
            },
            {
              url: "https://placehold.co/800x600/8B4513/FFF?text=Pearl+Street",
              alt: "Pearl Street location interior seating area",
              title: "Pearl Street",
              description: "Cozy neighborhood spot with fresh pastries daily",
              locationBlockId: dailyGrindBlock.id,
            },
            {
              url: "https://placehold.co/800x600/A0522D/FFF?text=Hawthorne+Blvd",
              alt: "Hawthorne Boulevard cafe with outdoor seating",
              title: "Hawthorne Boulevard",
              description:
                "Relaxed atmosphere perfect for working or meeting friends",
              locationBlockId: beanLeafBlock.id,
            },
          ],
          autoScroll: true,
          intervalSeconds: 5,
        },
      },
    });

    console.log(
      "✓ Café page with locationCarousel and location blocks (MULTI)"
    );
  }

  // FAQ Page with template data
  console.log("\nCreating FAQ page...");
  const faqPage = await prisma.page.upsert({
    where: { slug: "faq" },
    update: {},
    create: {
      slug: "faq",
      title: "Frequently Asked Questions",
      type: "FAQ",
      heroImage: null,
      content: "",
      metaDescription:
        "Find answers to common questions about our coffee, orders, shipping, returns, and more.",
      showInFooter: true,
      footerOrder: 4,
      isPublished: true,
      publishedAt: new Date(),
      generatedBy: "manual",
    },
  });

  // Delete existing blocks for FAQ page before creating new ones
  await prisma.block.deleteMany({
    where: { pageId: faqPage.id },
  });

  // Hero block for FAQ page
  await prisma.block.create({
    data: {
      pageId: faqPage.id,
      type: "hero",
      order: 0,
      isDeleted: false,
      content: {
        heading: "Frequently Asked Questions",
        imageUrl: "https://placehold.co/1920x800/654321/FFF?text=FAQ",
        imageAlt: "Coffee beans background",
        caption:
          "Find answers to common questions about our coffee, orders, shipping, and more.",
      },
    },
  });

  // FAQ items - seeded with template data organized by category
  const faqItems = [
    // General
    {
      category: "general",
      question: "What makes your coffee special?",
      answer:
        "We source our beans directly from small-batch farmers around the world, ensuring fair trade practices and exceptional quality. Each batch is roasted in small quantities to bring out the unique flavor profiles of each origin.",
    },
    {
      category: "general",
      question: "Do you offer coffee subscriptions?",
      answer:
        "Yes! We offer flexible subscription plans that deliver fresh-roasted coffee to your door on a schedule that works for you. You can choose weekly, bi-weekly, or monthly deliveries, and easily pause, skip, or cancel anytime.",
    },
    {
      category: "general",
      question: "Do you offer wholesale or bulk pricing?",
      answer:
        "Yes, we work with cafés, restaurants, and offices. Please contact us through our wholesale inquiry form for pricing and minimum order requirements.",
    },
    // Orders
    {
      category: "orders",
      question: "How do I place an order?",
      answer:
        "Simply browse our products, add items to your cart, and proceed to checkout. You can check out as a guest or create an account to track your orders and earn rewards.",
    },
    {
      category: "orders",
      question: "Can I modify or cancel my order?",
      answer:
        "We begin processing orders quickly! If you need to modify or cancel, please contact us immediately. Once an order has shipped, it cannot be changed, but you may be able to return it after delivery.",
    },
    {
      category: "orders",
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, Mastercard, American Express, Discover), as well as Apple Pay, Google Pay, and Shop Pay for a faster checkout experience.",
    },
    {
      category: "orders",
      question: "How do I track my order?",
      answer:
        "Once your order ships, you'll receive an email with tracking information. You can also log into your account to view order status and tracking details at any time.",
    },
    // Shipping
    {
      category: "shipping",
      question: "How long does shipping take?",
      answer:
        "Standard shipping typically takes 3-5 business days within the continental US. Expedited shipping options are available at checkout for faster delivery.",
    },
    {
      category: "shipping",
      question: "How much does shipping cost?",
      answer:
        "Shipping rates are calculated at checkout based on your location and order weight. We offer free standard shipping on orders over $50!",
    },
    {
      category: "shipping",
      question: "Do you offer local pickup?",
      answer:
        "Yes! You can select local pickup at checkout if you're in our area. We'll notify you when your order is ready for pickup at our roastery.",
    },
    {
      category: "shipping",
      question: "What if my package is lost or damaged?",
      answer:
        "Contact us right away! We'll work with the carrier to locate your package or file a claim. In most cases, we can ship a replacement or issue a refund.",
    },
    // Returns
    {
      category: "returns",
      question: "What is your return policy?",
      answer:
        "We want you to love your coffee! If you're not satisfied, contact us within 30 days of delivery. We'll make it right with an exchange, store credit, or refund.",
    },
    {
      category: "returns",
      question: "Can I return opened coffee?",
      answer:
        "Yes—we stand behind our products. If you're not satisfied with the taste, reach out and we'll work with you to find a coffee you'll love or provide a refund.",
    },
    {
      category: "returns",
      question: "How do I start a return?",
      answer:
        "Contact our support team through the Contact page or email us. We'll provide instructions and, if needed, a prepaid return label. Refunds are typically processed within 5-7 business days after we receive the return.",
    },
    // Products
    {
      category: "products",
      question: "How should I store my coffee?",
      answer:
        "Store your coffee in a cool, dark place in an airtight container. Avoid the refrigerator or freezer, as moisture can affect the flavor. For best taste, use within 2-4 weeks of the roast date.",
    },
    {
      category: "products",
      question: "What grind sizes do you offer?",
      answer:
        "We offer whole bean (recommended for freshness), coarse (French press), medium (drip/pour-over), and fine (espresso). Select your preferred grind at checkout.",
    },
    {
      category: "products",
      question: "Do you have decaf options?",
      answer:
        "Yes! We offer Swiss Water Process decaf that maintains great flavor with 99.9% of caffeine removed. Check our product listings for current decaf offerings.",
    },
    {
      category: "products",
      question: "What roast levels do you offer?",
      answer:
        "We roast from light to dark. Light roasts highlight origin flavors, medium roasts balance brightness and body, and dark roasts offer bold, rich flavors. Product pages describe each coffee's roast level.",
    },
    // Account
    {
      category: "account",
      question: "How do I create an account?",
      answer:
        "Click 'Sign In' at the top of the page and select 'Create Account.' You can also create an account during checkout. An account lets you track orders, manage subscriptions, and save favorites.",
    },
    {
      category: "account",
      question: "I forgot my password. How do I reset it?",
      answer:
        "Click 'Sign In,' then 'Forgot Password.' Enter your email address and we'll send you a link to reset your password. Check your spam folder if you don't see the email.",
    },
    {
      category: "account",
      question: "How do I manage my subscription?",
      answer:
        "Log into your account and go to the Subscriptions section. From there, you can change frequency, update products, skip shipments, or cancel anytime.",
    },
  ];

  // Create FAQ item blocks
  for (let i = 0; i < faqItems.length; i++) {
    const faq = faqItems[i];
    await prisma.block.create({
      data: {
        pageId: faqPage.id,
        type: "faqItem",
        order: i + 1,
        isDeleted: false,
        content: {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
        },
      },
    });
  }

  console.log(`✓ FAQ page with ${faqItems.length} FAQ items`);

  console.log(`\n✅ All seeding complete!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
