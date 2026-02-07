import { Prisma, PrismaClient, ProductType } from "@prisma/client";

interface MerchVariant {
  name: string;
  priceInCents: number;
  weight?: number;
  stockQuantity?: number;
}

interface MerchDetail {
  label: string;
  value: string;
}

interface MerchItem {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  variants: MerchVariant[];
  details?: MerchDetail[];
}
const getMerchSeedMode = () => {
  const raw = (process.env.SEED_PRODUCT_MODE ?? "full").toLowerCase();
  if (["minimal", "lean", "tiny", "demo"].includes(raw)) return "minimal";
  return "full";
};

const merchItemsFull: MerchItem[] = [
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
        weight: 400,
        stockQuantity: 120,
      },
    ],
    details: [
      { label: "Material", value: "Ceramic" },
      { label: "Capacity", value: "12 oz (355 ml)" },
      { label: "Dishwasher Safe", value: "Yes" },
      { label: "Microwave Safe", value: "Yes" },
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
        weight: 350,
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
        weight: 250,
        stockQuantity: 60,
      },
      {
        name: "Medium",
        priceInCents: 2600,
        weight: 260,
        stockQuantity: 90,
      },
      {
        name: "Large",
        priceInCents: 2600,
        weight: 270,
        stockQuantity: 70,
      },
    ],
    details: [
      { label: "Material", value: "100% Cotton" },
      { label: "Fit", value: "Unisex, pre-shrunk" },
      { label: "Care", value: "Machine wash cold, tumble dry low" },
    ],
  },
  {
    name: "Origami Air Dripper",
    slug: "origami-air-dripper",
    description:
      "Lightweight ceramic dripper with crisp ribs for fast, bright extractions. Compatible with conical filters.",
    imageUrl:
      "https://placehold.co/600x400/D6D0C4/1A1A1A.png?text=Origami+Dripper",
    variants: [
      {
        name: "Single",
        priceInCents: 4200,
        weight: 450,
        stockQuantity: 60,
      },
    ],
  },
  {
    name: "Origami Cone Filters (100ct)",
    slug: "origami-cone-filters",
    description:
      "Bleached conical filters sized for Origami. Fast flow and clean cups.",
    imageUrl:
      "https://placehold.co/600x400/F8F1E7/0F0B05.png?text=Cone+Filters",
    variants: [
      {
        name: "100 pack",
        priceInCents: 1200,
        weight: 200,
        stockQuantity: 200,
      },
    ],
  },
  {
    name: "Fellow Stagg EKG Kettle",
    slug: "fellow-stagg-ekg-kettle",
    description:
      "Precision pour-over kettle with gooseneck control and variable temperature for consistent brews.",
    imageUrl: "https://placehold.co/600x400/111111/F5F3EF.png?text=Stagg+EKG",
    isFeatured: true,
    featuredOrder: 121,
    variants: [
      {
        name: "Matte Black",
        priceInCents: 16500,
        weight: 1500,
        stockQuantity: 20,
      },
    ],
    details: [
      { label: "Capacity", value: "0.9 L" },
      { label: "Temperature Range", value: "135°F – 212°F" },
      { label: "Material", value: "Stainless Steel" },
      { label: "Power", value: "1200W" },
      { label: "Cord Length", value: "2.6 ft" },
    ],
  },
  {
    name: "Timemore Black Mirror Scale",
    slug: "timemore-black-mirror-scale",
    description:
      "Responsive brew scale with timer and USB-C charging. Great for pour-over and espresso dialing.",
    imageUrl:
      "https://placehold.co/600x400/0C0C0C/FFFFFF.png?text=Timemore+Scale",
    variants: [
      {
        name: "Standard",
        priceInCents: 9000,
        weight: 600,
        stockQuantity: 45,
      },
    ],
  },
  {
    name: "Airscape Coffee Canister",
    slug: "airscape-coffee-canister",
    description:
      "Stainless canister with inner lid that pushes air out to keep beans fresher longer.",
    imageUrl: "https://placehold.co/600x400/D8DDE2/0F172A.png?text=Airscape",
    variants: [
      {
        name: "Medium",
        priceInCents: 3800,
        weight: 650,
        stockQuantity: 90,
      },
    ],
  },
  {
    name: "Cold Brew Bottle",
    slug: "cold-brew-bottle",
    description:
      "Durable glass bottle with fine mesh filter for overnight brews. Easy to clean, travel friendly.",
    imageUrl: "https://placehold.co/600x400/F5F5F5/1A1A1A.png?text=Cold+Brew",
    variants: [
      {
        name: "750ml",
        priceInCents: 3200,
        weight: 700,
        stockQuantity: 70,
      },
    ],
  },
  {
    name: "Barista Towel 2-Pack",
    slug: "barista-towel-2-pack",
    description:
      "Lint-free microfiber towels sized for bar cleanup and portafilter prep.",
    imageUrl:
      "https://placehold.co/600x400/E5E7EB/111827.png?text=Barista+Towels",
    variants: [
      {
        name: "2 towels",
        priceInCents: 1400,
        weight: 250,
        stockQuantity: 150,
      },
    ],
  },
  {
    name: "Cupping Spoon",
    slug: "cupping-spoon",
    description:
      "Stainless steel cupping spoon with deep bowl for sensory sessions and QC.",
    imageUrl:
      "https://placehold.co/600x400/111827/F5F3EF.png?text=Cupping+Spoon",
    variants: [
      {
        name: "Single",
        priceInCents: 900,
        weight: 120,
        stockQuantity: 120,
      },
    ],
  },
  {
    name: "Enamel Pin Set",
    slug: "enamel-pin-set",
    description:
      "Two-piece enamel pin set with the roastery crest and origin stamp.",
    imageUrl: "https://placehold.co/600x400/F0F9FF/0F172A.png?text=Enamel+Pins",
    variants: [
      {
        name: "Set of 2",
        priceInCents: 1200,
        weight: 100,
        stockQuantity: 160,
      },
    ],
  },
];

export async function seedMerch(prisma: PrismaClient) {
  const seedMode = getMerchSeedMode();
  const merchItems =
    seedMode === "minimal" ? merchItemsFull.slice(0, 1) : merchItemsFull;

  console.log(`\n🧢 Seeding merch products (${seedMode})...`);

  const merchCategory = await prisma.category.findUnique({
    where: { slug: "merch" },
  });
  if (!merchCategory) {
    console.log(
      "  ↷ Skipped: merch category not found (run seedCategories first)."
    );
    return;
  }

  const productLookup: Record<
    string,
    { productId: string; variants: { id: string; name: string }[] }
  > = {};

  for (const item of merchItems) {
    const primaryCategory = { categoryId: merchCategory.id, isPrimary: true };

    const variants = item.variants.map((variant) => ({
      name: variant.name,
      weight: variant.weight ?? 0,
      stockQuantity: variant.stockQuantity ?? 50,
      purchaseOptions: {
        create: [
          { type: "ONE_TIME" as const, priceInCents: variant.priceInCents },
        ],
      },
    }));

    const product = await prisma.product.upsert({
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
        roastLevel: null,
        details: item.details
          ? (item.details as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        // Delete existing images so placeholders are used
        images: { deleteMany: {} },
        categories: { deleteMany: {}, create: [primaryCategory] },
        // Do not delete/recreate variants on update to avoid breaking
        // existing OrderItem.purchaseOptionId foreign keys.
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
        roastLevel: null,
        details: item.details
          ? (item.details as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        categories: { create: [primaryCategory] },
        variants: { create: variants },
      },
      include: { variants: true },
    });

    const productWithVariants = product as typeof product & {
      variants: Array<{ id: string; name: string }>;
    };
    productLookup[item.slug] = {
      productId: productWithVariants.id,
      variants: productWithVariants.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
      })),
    };
  }

  console.log(`  ✓ Seeded ${merchItems.length} merch products`);

  if (seedMode === "minimal") {
    console.log("  ↷ Skipped add-on links in minimal mode.");
    return;
  }

  const addOnLinks: Array<{
    primarySlug: string;
    addOnSlug: string;
    primaryVariantName?: string;
    addOnVariantName?: string;
    discountedPriceInCents?: number;
  }> = [
    {
      primarySlug: "origami-air-dripper",
      addOnSlug: "origami-cone-filters",
      discountedPriceInCents: 1000,
    },
    {
      primarySlug: "origami-air-dripper",
      addOnSlug: "barista-towel-2-pack",
    },
    {
      primarySlug: "origami-air-dripper",
      addOnSlug: "enamel-pin-set",
    },
    {
      primarySlug: "cold-brew-bottle",
      addOnSlug: "barista-towel-2-pack",
    },
    {
      primarySlug: "fellow-stagg-ekg-kettle",
      addOnSlug: "barista-towel-2-pack",
    },
    {
      primarySlug: "airscape-coffee-canister",
      addOnSlug: "enamel-pin-set",
    },
  ];

  const productIds = Object.values(productLookup).map((p) => p.productId);
  if (productIds.length) {
    await prisma.addOnLink.deleteMany({
      where: { primaryProductId: { in: productIds } },
    });
  }

  const resolveVariant = (
    slug: string,
    name?: string
  ): { productId: string; variantId: string } | null => {
    const entry = productLookup[slug];
    if (!entry) return null;
    if (entry.variants.length === 0) return null;
    if (!name) {
      return { productId: entry.productId, variantId: entry.variants[0].id };
    }
    const match = entry.variants.find(
      (variant) => variant.name.toLowerCase() === name.toLowerCase()
    );
    return match ? { productId: entry.productId, variantId: match.id } : null;
  };

  for (const link of addOnLinks) {
    const primary = resolveVariant(link.primarySlug, link.primaryVariantName);
    const addOn = resolveVariant(link.addOnSlug, link.addOnVariantName);

    if (!primary || !addOn) {
      console.log(
        `  ↷ Skipped add-on link: ${link.primarySlug} → ${link.addOnSlug} (missing product or variant)`
      );
      continue;
    }

    await prisma.addOnLink.create({
      data: {
        primaryProductId: primary.productId,
        addOnProductId: addOn.productId,
        primaryVariantId: primary.variantId,
        addOnVariantId: addOn.variantId,
        discountedPriceInCents: link.discountedPriceInCents,
      },
    });
  }

  console.log(`  ✓ Seeded ${addOnLinks.length} merch add-on links`);
}
