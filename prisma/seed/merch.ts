import { PrismaClient, ProductType, RoastLevel } from "@prisma/client";

interface MerchVariant {
  name: string;
  priceInCents: number;
  weightInGrams?: number;
  stockQuantity?: number;
}

interface MerchItem {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  variants: MerchVariant[];
}

const merchItems: MerchItem[] = [
  {
    name: "Heritage Diner Mug",
    slug: "heritage-diner-mug",
    description:
      "Thick-walled ceramic diner mug with our crest. Holds heat, feels solid, and lives on your desk for years.",
    imageUrl: "https://placehold.co/600x400/0F0B05/D9B166.png?text=Diner+Mug",
    isFeatured: true,
    featuredOrder: 120,
    variants: [
      {
        name: "12oz",
        priceInCents: 1800,
        weightInGrams: 400,
        stockQuantity: 120,
      },
    ],
  },
  {
    name: "Everyday Camp Tumbler",
    slug: "everyday-camp-tumbler",
    description:
      "Vacuum insulated, leak-resistant lid, fits car cup holders. Powder coat finish with tonal logo.",
    imageUrl:
      "https://placehold.co/600x400/1A1A1A/F5F3EF.png?text=Camp+Tumbler",
    variants: [
      {
        name: "16oz",
        priceInCents: 3200,
        weightInGrams: 350,
        stockQuantity: 80,
      },
    ],
  },
  {
    name: "Roastery Script Tee",
    slug: "roastery-script-tee",
    description:
      "Soft-wash cotton tee with vintage script lockup. Pre-shrunk, unisex fit.",
    imageUrl: "https://placehold.co/600x400/202733/F5F3EF.png?text=Script+Tee",
    variants: [
      {
        name: "Small",
        priceInCents: 2600,
        weightInGrams: 250,
        stockQuantity: 60,
      },
      {
        name: "Medium",
        priceInCents: 2600,
        weightInGrams: 260,
        stockQuantity: 90,
      },
      {
        name: "Large",
        priceInCents: 2600,
        weightInGrams: 270,
        stockQuantity: 70,
      },
    ],
  },
];

export async function seedMerch(prisma: PrismaClient) {
  console.log("\n🧢 Seeding merch products...");

  const merchCategory = await prisma.category.findUnique({
    where: { slug: "merch" },
  });
  if (!merchCategory) {
    console.log(
      "  ↷ Skipped: merch category not found (run seedCategories first)."
    );
    return;
  }

  for (const item of merchItems) {
    const primaryCategory = { categoryId: merchCategory.id, isPrimary: true };

    const variants = item.variants.map((variant) => ({
      name: variant.name,
      weightInGrams: variant.weightInGrams ?? 0,
      stockQuantity: variant.stockQuantity ?? 50,
      purchaseOptions: {
        create: [
          { type: "ONE_TIME" as const, priceInCents: variant.priceInCents },
        ],
      },
    }));

    const weightInGrams = Math.max(
      ...variants.map((v) => v.weightInGrams ?? 0),
      0
    );

    await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        origin: [],
        tastingNotes: [],
        isOrganic: false,
        isFeatured: item.isFeatured ?? false,
        featuredOrder: item.featuredOrder,
        type: ProductType.MERCH,
        weightInGrams,
        roastLevel: RoastLevel.MEDIUM,
        images: {
          deleteMany: {},
          create: [{ url: item.imageUrl, altText: item.name, order: 1 }],
        },
        categories: { deleteMany: {}, create: [primaryCategory] },
        variants: { deleteMany: {}, create: variants },
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        origin: [],
        tastingNotes: [],
        isOrganic: false,
        isFeatured: item.isFeatured ?? false,
        featuredOrder: item.featuredOrder,
        type: ProductType.MERCH,
        weightInGrams,
        roastLevel: RoastLevel.MEDIUM,
        images: {
          create: [{ url: item.imageUrl, altText: item.name, order: 1 }],
        },
        categories: { create: [primaryCategory] },
        variants: { create: variants },
      },
    });
  }

  console.log(`  ✓ Seeded ${merchItems.length} merch products`);
}
