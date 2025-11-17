import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, PurchaseType, RoastLevel, BillingInterval } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- 1. Create Categories ---
  // We use upsert to avoid creating duplicates
  const catBlends = await prisma.category.upsert({
    where: { slug: "blends" },
    update: {},
    create: { name: "Blends", slug: "blends" },
  });

  const catSingleOrigin = await prisma.category.upsert({
    where: { slug: "single-origin" },
    update: {},
    create: { name: "Single Origin", slug: "single-origin" },
  });

  const catLight = await prisma.category.upsert({
    where: { slug: "light-roast" },
    update: {},
    create: { name: "Light Roast", slug: "light-roast" },
  });

  const catMedium = await prisma.category.upsert({
    where: { slug: "medium-roast" },
    update: {},
    create: { name: "Medium Roast", slug: "medium-roast" },
  });

  const catDark = await prisma.category.upsert({
    where: { slug: "dark-roast" },
    update: {},
    create: { name: "Dark Roast", slug: "dark-roast" },
  });

  const catMicroLot = await prisma.category.upsert({
    where: { slug: "micro-lot" },
    update: {},
    create: { name: "Micro Lot", slug: "micro-lot" },
  });

  // NEW: Added the Vietnam category from your previous seed file
  const catVietnam = await prisma.category.upsert({
    where: { slug: "vietnam" },
    update: {},
    create: { name: "Vietnam", slug: "vietnam" },
  });

  console.log("Categories created/verified.");

  // --- 2. Define Products and Links ---

  const coffeeData = [
    // 1. Death Valley Espresso
    {
      product: {
        name: "Death Valley Espresso",
        slug: "death-valley-espresso",
        description:
          "A rich, full-bodied espresso blend. Sweet and chocolaty, with notes of baking chocolate, orange zest, and brown sugar. The foundation of our cafe drinks.",
        origin: ["Ethiopia", "Colombia", "Indonesia"],
        tastingNotes: ["Baking Chocolate", "Orange Zest", "Brown Sugar"],
        isOrganic: true,
        roastLevel: RoastLevel.DARK,
        isFeatured: true,
        featuredOrder: 1,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/3D2C1D/FFFFFF.png?text=Death+Valley",
              altText: "Death Valley Espresso bag",
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
                  { type: PurchaseType.ONE_TIME, priceInCents: 2200 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2090,
                    discountMessage: "Save 5%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 1,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 1980,
                    discountMessage: "Save 10%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 2,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 1980,
                    discountMessage: "Save 10%",
                    billingInterval: BillingInterval.MONTH,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
            {
              name: "2lb Bag",
              weightInGrams: 907,
              stockQuantity: 50,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 5800 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 5510,
                    discountMessage: "Save 5%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 1,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 5220,
                    discountMessage: "Save 10%",
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

    // 2. Vietnam Lam Dong Peaberry
    {
      product: {
        name: "Vietnam Lam Dong Peaberry",
        slug: "vietnam-lam-dong-peaberry",
        description:
          "A bright, clean peaberry from the highlands of Vietnam. Features a smooth body with hints of bright citrus and spice.",
        origin: ["Vietnam"],
        tastingNotes: ["Bright Citrus", "Smooth Body", "Hint of Spice"],
        isOrganic: false,
        roastLevel: RoastLevel.LIGHT,
        isFeatured: true,
        featuredOrder: 2,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/8B4513/FFFFFF.png?text=Vietnam+Peaberry",
              altText: "Vietnam Peaberry bag",
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
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2400 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catLight.id, isPrimary: false },
        { categoryId: catMicroLot.id, isPrimary: false },
        { categoryId: catVietnam.id, isPrimary: false }, // Also add to Vietnam category
      ],
    },

    // 3. Ethiopian Yirgacheffe
    {
      product: {
        name: "Ethiopian Yirgacheffe",
        slug: "ethiopian-yirgacheffe",
        description:
          "A classic from Ethiopia, known for its delicate, tea-like body and bright, floral and lemon notes. A favorite for pour-over lovers.",
        origin: ["Ethiopia"],
        tastingNotes: ["Floral", "Lemon", "Black Tea"],
        isOrganic: true,
        roastLevel: RoastLevel.LIGHT,
        isFeatured: true,
        featuredOrder: 3,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/A0522D/FFFFFF.png?text=Yirgacheffe",
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
              stockQuantity: 75,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 2350 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2230,
                    discountMessage: "Save 5%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 1,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2115,
                    discountMessage: "Save 10%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 2,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2115,
                    discountMessage: "Save 10%",
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

    // 4. Colombian Supremo
    {
      product: {
        name: "Colombian Supremo",
        slug: "colombian-supremo",
        description:
          "A well-balanced and smooth coffee, perfect for any time of day. Features notes of caramel, nutty undertones, and a mild, pleasant acidity.",
        origin: ["Colombia"],
        tastingNotes: ["Caramel", "Nutty", "Mild Acidity"],
        isOrganic: false,
        roastLevel: RoastLevel.MEDIUM,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/D2691E/FFFFFF.png?text=Colombian+Supremo",
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
              stockQuantity: 80,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2100 }],
              },
            },
            {
              name: "2lb Bag",
              weightInGrams: 907,
              stockQuantity: 20,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 5500 }],
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

    // 5. Sumatra Mandheling
    {
      product: {
        name: "Sumatra Mandheling",
        slug: "sumatra-mandheling",
        description:
          "A classic Indonesian coffee. Full-bodied, earthy, and low in acidity, with notes of dark chocolate and cedar.",
        origin: ["Indonesia"],
        tastingNotes: ["Earthy", "Dark Chocolate", "Cedar"],
        isOrganic: true,
        roastLevel: RoastLevel.DARK,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/5B3A29/FFFFFF.png?text=Sumatra",
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
              stockQuantity: 60,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2250 }],
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

    // 6. Guatemalan Antigua
    {
      product: {
        name: "Guatemalan Antigua",
        slug: "guatemalan-antigua",
        description:
          "A rich, complex coffee with a velvety body. Notes of milk chocolate, bright citrus, and a hint of spice.",
        origin: ["Guatemala"],
        tastingNotes: ["Milk Chocolate", "Citrus", "Spice"],
        isOrganic: false,
        roastLevel: RoastLevel.MEDIUM,
        isFeatured: true,
        featuredOrder: 4,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/6F4E37/FFFFFF.png?text=Guatemala",
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
              stockQuantity: 90,
              purchaseOptions: {
                create: [
                  { type: PurchaseType.ONE_TIME, priceInCents: 2300 },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2185,
                    discountMessage: "Save 5%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 1,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2070,
                    discountMessage: "Save 10%",
                    billingInterval: BillingInterval.WEEK,
                    billingIntervalCount: 2,
                  },
                  {
                    type: PurchaseType.SUBSCRIPTION,
                    priceInCents: 2070,
                    discountMessage: "Save 10%",
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

    // 7. Kenya AA
    {
      product: {
        name: "Kenya AA",
        slug: "kenya-aa",
        description:
          "Incredibly bright and vibrant, with a wine-like acidity. Expect bold notes of blackcurrant, grapefruit, and a syrupy body.",
        origin: ["Kenya"],
        tastingNotes: ["Blackcurrant", "Grapefruit", "Wine-like"],
        isOrganic: false,
        roastLevel: RoastLevel.LIGHT,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/4A2C2A/FFFFFF.png?text=Kenya+AA",
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
              stockQuantity: 40,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2500 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catLight.id, isPrimary: false },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 8. Costa Rica Tarrazú
    {
      product: {
        name: "Costa Rica Tarrazú",
        slug: "costa-rica-tarrazu",
        description:
          "A classic Costa Rican coffee, well-balanced and clean. Features notes of brown sugar, dried fruit, and a bright, crisp finish.",
        origin: ["Costa Rica"],
        tastingNotes: ["Brown Sugar", "Dried Fruit", "Crisp Finish"],
        isOrganic: false,
        roastLevel: RoastLevel.MEDIUM,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/7B5E49/FFFFFF.png?text=Costa+Rica",
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
              stockQuantity: 55,
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

    // 9. Brazil Santos
    {
      product: {
        name: "Brazil Santos",
        slug: "brazil-santos",
        description:
          "A smooth, mild, and nutty coffee. Very low acidity, making it a crowd-pleaser and a great base for espresso blends.",
        origin: ["Brazil"],
        tastingNotes: ["Nutty", "Mild", "Low Acidity"],
        isOrganic: false,
        roastLevel: RoastLevel.MEDIUM,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/967259/FFFFFF.png?text=Brazil+Santos",
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
              stockQuantity: 110,
              purchaseOptions: {
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2000 }],
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

    // 10. Vietnam Dalat (Anaerobic)
    {
      product: {
        name: "Vietnam Dalat (Anaerobic)",
        slug: "vietnam-dalat-anaerobic",
        description:
          "An experimental, modern coffee from Vietnam. This anaerobic processed bean has unique, wine-like fruit notes and a complex profile.",
        origin: ["Vietnam"],
        tastingNotes: ["Red Wine", "Funky Fruit", "Complex"],
        isOrganic: true,
        roastLevel: RoastLevel.LIGHT,
        isFeatured: true,
        featuredOrder: 5, // Showcasing a second Vietnamese coffee
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/6B2B3A/FFFFFF.png?text=Vietnam+Dalat",
              altText: "Vietnam Dalat Anaerobic bag",
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
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2600 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catLight.id, isPrimary: false },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },

    // 11. Vietnam Min Mt. Starmaya (Washed)
    {
      product: {
        name: "Vietnam Min Mt. Starmaya (Washed)",
        slug: "min-mt-starmaya-washed",
        description:
          "A young variety coffee from Vietnam. This fully washed bean has stone fruits, almond notes with a complex profile.",
        origin: ["Vietnam"],
        tastingNotes: ["Stone Fruit", "Almond", "Complex"],
        isOrganic: true,
        roastLevel: RoastLevel.LIGHT,
        isFeatured: false,
        images: {
          create: [
            {
              url: "https://placehold.co/600x400/6B2B3A/FFFFFF.png?text=Min+Mt+Starmaya",
              altText: "Vietnam Min Mt. Starmaya bag",
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
                create: [{ type: PurchaseType.ONE_TIME, priceInCents: 2600 }],
              },
            },
          ],
        },
      },
      categories: [
        { categoryId: catSingleOrigin.id, isPrimary: true },
        { categoryId: catLight.id, isPrimary: false },
        { categoryId: catMicroLot.id, isPrimary: false },
      ],
    },
  ];

  // Loop and upsert products
  for (const item of coffeeData) {
    const { product: productData, categories: categoryLinks } = item;

    // First, create/update the product
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        ...productData, // Update all top-level fields
        // Clear existing relations before updating
        images: {
          deleteMany: {},
          create: productData.images.create,
        },
        variants: {
          deleteMany: {},
          create: productData.variants.create,
        },
      },
      create: productData,
    });

    // After product is created/found, clear and set its categories
    // This ensures the links are fresh
    await prisma.categoriesOnProducts.deleteMany({
      where: { productId: product.id },
    });

    await prisma.categoriesOnProducts.createMany({
      data: categoryLinks.map((link) => ({
        productId: product.id,
        categoryId: link.categoryId,
        isPrimary: link.isPrimary,
      })),
    });

    console.log(`Created or updated product: ${product.name}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
