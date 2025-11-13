import { PrismaClient, PurchaseType } from "@prisma/client";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Define your 10 mock coffee products
const coffeeData = [
  {
    name: "Hayes Valley Espresso",
    slug: "hayes-valley-espresso",
    description:
      "A rich, full-bodied espresso blend. Sweet and chocolaty, with notes of baking chocolate, orange zest, and brown sugar. The foundation of our cafe drinks.",
    tastingNotes: ["Baking Chocolate", "Orange Zest", "Brown Sugar"],
    isOrganic: true,
    isFeatured: true,
    featuredOrder: 1,
    images: {
      create: [
        // UPDATED: Added .png to the URL
        {
          url: "https://placehold.co/600x400/3D2C1D/FFFFFF.png?text=Hayes+Valley",
          altText: "Hayes Valley Espresso bag",
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
    tastingNotes: ["Bright Citrus", "Smooth Body", "Hint of Spice"],
    isOrganic: false,
    isFeatured: true,
    featuredOrder: 2,
    images: {
      create: [
        // UPDATED: Added .png to the URL
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
    tastingNotes: ["Floral", "Lemon", "Black Tea"],
    isOrganic: true,
    isFeatured: true,
    featuredOrder: 3,
    images: {
      create: [
        // UPDATED: Added .png to the URL
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
    tastingNotes: ["Caramel", "Nutty", "Mild Acidity"],
    isOrganic: false,
    isFeatured: false,
    images: {
      create: [
        // UPDATED: Added .png to the URL
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
    tastingNotes: ["Earthy", "Dark Chocolate", "Cedar"],
    isOrganic: true,
    isFeatured: false,
    images: {
      create: [
        // UPDATED: Added .png to the URL
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
    tastingNotes: ["Milk Chocolate", "Citrus", "Spice"],
    isOrganic: false,
    isFeatured: true,
    featuredOrder: 4,
    images: {
      create: [
        // UPDATED: Added .png to the URL
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
    tastingNotes: ["Blackcurrant", "Grapefruit", "Wine-like"],
    isOrganic: false,
    isFeatured: false,
    images: {
      create: [
        // UPDATED: Added .png to the URL
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
    tastingNotes: ["Brown Sugar", "Dried Fruit", "Crisp Finish"],
    isOrganic: false,
    isFeatured: false,
    images: {
      create: [
        // UPDATED: Added .png to the URL
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
    tastingNotes: ["Nutty", "Mild", "Low Acidity"],
    isOrganic: false,
    isFeatured: false,
    images: {
      create: [
        // UPDATED: Added .png to the URL
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
    tastingNotes: ["Red Wine", "Funky Fruit", "Complex"],
    isOrganic: true,
    isFeatured: true,
    featuredOrder: 5, // Showcasing a second Vietnamese coffee
    images: {
      create: [
        // UPDATED: Added .png to the URL
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

  // We use `upsert` to avoid creating duplicate entries if the script is run again.
  // It finds a product by its unique 'slug'.
  // If it exists (`where`), it does `update`.
  // If it doesn't exist, it does `create`.
  for (const p of coffeeData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {}, // We'll just skip updating if it exists
      create: p, // The 'p' object includes all the nested 'create' for images/variants
    });
    console.log(
      `Created or found product with id: ${product.id} (${product.name})`
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
