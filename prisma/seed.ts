import { PrismaClient, PurchaseType, RoastLevel } from "@prisma/client";

const prisma = new PrismaClient();

const coffeeData = [
  {
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
        }, // <-- UPDATED
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
                priceInCents: 1980,
                discountMessage: "Save 10%",
                deliverySchedule: "Every 2 Weeks",
              },
            ],
          },
        },
      ],
    },
  },
  {
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
  {
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
                priceInCents: 2115,
                discountMessage: "Save 10%",
                deliverySchedule: "Every 4 Weeks",
              },
            ],
          },
        },
      ],
    },
  },
  {
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
  {
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
  {
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
                priceInCents: 2070,
                discountMessage: "Save 10%",
                deliverySchedule: "Every 3 Weeks",
              },
            ],
          },
        },
      ],
    },
  },
  {
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
  {
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
  {
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
  {
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
];

async function main() {
  console.log(`Start seeding ...`);

  for (const p of coffeeData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        ...p, // Update all top-level fields
        // We need to delete existing relations before updating
        // This is a simple way to handle upserting relations
        images: {
          deleteMany: {}, // Delete all existing images for this product
          create: p.images.create, // Create the new ones
        },
        variants: {
          deleteMany: {}, // Delete all existing variants
          create: p.variants.create, // Create the new ones
        },
      },
      create: p, // The 'p' object includes all the nested 'create'
    });
    console.log(
      `Created or updated product with id: ${product.id} (${product.name})`
    );
  }
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma Client connection
    await prisma.$disconnect();
  });
