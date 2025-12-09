import { PrismaClient } from "@prisma/client";

export async function seedCategories(prisma: PrismaClient) {
  console.log("  📂 Creating categories...");

  // First, get the label settings created in settings module
  const labelCollections = await prisma.siteSettings.findUnique({
    where: { key: "label_collections" },
  });
  const labelRoasts = await prisma.siteSettings.findUnique({
    where: { key: "label_roasts" },
  });
  const labelOrigins = await prisma.siteSettings.findUnique({
    where: { key: "label_origins" },
  });

  if (!labelCollections || !labelRoasts || !labelOrigins) {
    throw new Error(
      "Required label settings not found. Run seedSettings first."
    );
  }

  // Collection Categories
  const _catBlends = await prisma.category.upsert({
    where: { slug: "blends" },
    update: {},
    create: {
      name: "Blend",
      slug: "blends",
      labelSettingId: labelCollections.id,
      order: 20,
    },
  });

  const _catMerch = await prisma.category.upsert({
    where: { slug: "merch" },
    update: {},
    create: {
      name: "Merch",
      slug: "merch",
      labelSettingId: labelCollections.id,
      order: 25,
      showPurchaseOptions: true,
    },
  });

  const _catSingleOrigin = await prisma.category.upsert({
    where: { slug: "single-origin" },
    update: {},
    create: {
      name: "Single Origin",
      slug: "single-origin",
      labelSettingId: labelCollections.id,
      order: 22,
    },
  });

  const _catMicroLot = await prisma.category.upsert({
    where: { slug: "micro-lot" },
    update: {},
    create: {
      name: "Micro Lot",
      slug: "micro-lot",
      labelSettingId: labelCollections.id,
      order: 21,
    },
  });

  // Roast Level Categories
  const _catDark = await prisma.category.upsert({
    where: { slug: "dark-roast" },
    update: {},
    create: {
      name: "Dark Roast",
      slug: "dark-roast",
      labelSettingId: labelRoasts.id,
      order: 3,
    },
  });

  const _catMedium = await prisma.category.upsert({
    where: { slug: "medium-roast" },
    update: {},
    create: {
      name: "Medium Roast",
      slug: "medium-roast",
      labelSettingId: labelRoasts.id,
      order: 2,
    },
  });

  const _catLight = await prisma.category.upsert({
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

  console.log("  ✅ Categories created/verified");
}
