import {
  PrismaClient,
  RoastLevel,
  Category,
  ProductType,
} from "@prisma/client";

const getProductSeedMode = () => {
  const raw = (process.env.SEED_PRODUCT_MODE ?? "full").toLowerCase();
  if (["minimal", "lean", "tiny", "demo"].includes(raw)) return "minimal";
  return "full";
};

export async function seedProducts(prisma: PrismaClient) {
  const productSeedMode = getProductSeedMode();
  const isMinimal = productSeedMode === "minimal";

  console.log(`  🛒 Creating products... (mode: ${productSeedMode})`);

  // Get category references
  const catBlends = await prisma.category.findUnique({
    where: { slug: "blends" },
  });
  const catSingleOrigin = await prisma.category.findUnique({
    where: { slug: "single-origin" },
  });
  const catMicroLot = await prisma.category.findUnique({
    where: { slug: "micro-lot" },
  });
  const catDark = await prisma.category.findUnique({
    where: { slug: "dark-roast" },
  });
  const catMedium = await prisma.category.findUnique({
    where: { slug: "medium-roast" },
  });
  const catLight = await prisma.category.findUnique({
    where: { slug: "light-roast" },
  });
  const catMerch = await prisma.category.findUnique({
    where: { slug: "merch" },
  });

  if (
    !catBlends ||
    !catSingleOrigin ||
    !catMicroLot ||
    !catDark ||
    !catMedium ||
    !catLight
  ) {
    throw new Error("Required categories not found. Run seedCategories first.");
  }

  if (isMinimal && !catMerch) {
    throw new Error("Merch category not found. Run seedCategories first.");
  }

  // Get origin categories
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

  const originCategories: Record<string, Category | null> = {};
  for (const origin of origins) {
    const slug = origin.toLowerCase().replace(/\s+/g, "-");
    originCategories[origin] = await prisma.category.findUnique({
      where: { slug },
    });
  }

  if (
    !catBlends ||
    !catSingleOrigin ||
    !catMicroLot ||
    !catDark ||
    !catMedium ||
    !catLight
  ) {
    throw new Error("Required categories not found. Run seedCategories first.");
  }

  // Product data - 30 specialty coffee products
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 150,
              purchaseOptions: {
                create: [
                  { type: "ONE_TIME" as const, priceInCents: 2200 },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 2090,
                    billingInterval: "WEEK" as const,
                    billingIntervalCount: 2,
                  },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 1980,
                    billingInterval: "MONTH" as const,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
            {
              name: "2lb Bag",
              weight: 907,
              stockQuantity: 75,
              purchaseOptions: {
                create: [
                  { type: "ONE_TIME" as const, priceInCents: 5600 },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 5320,
                    billingInterval: "MONTH" as const,
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 120,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2100 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 85,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2400 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 95,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2050 }],
              },
            },
            {
              name: "5lb Bulk Bag",
              weight: 2268,
              stockQuantity: 25,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 12500 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 45,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2650 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 110,
              purchaseOptions: {
                create: [
                  { type: "ONE_TIME" as const, priceInCents: 2300 },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 2185,
                    billingInterval: "MONTH" as const,
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 180,
              purchaseOptions: {
                create: [
                  { type: "ONE_TIME" as const, priceInCents: 1950 },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 1850,
                    billingInterval: "WEEK" as const,
                    billingIntervalCount: 1,
                  },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 1755,
                    billingInterval: "MONTH" as const,
                    billingIntervalCount: 1,
                  },
                ],
              },
            },
            {
              name: "2lb Bag",
              weight: 907,
              stockQuantity: 90,
              purchaseOptions: {
                create: [
                  { type: "ONE_TIME" as const, priceInCents: 5000 },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 4750,
                    billingInterval: "MONTH" as const,
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 130,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2100 }],
              },
            },
            {
              name: "2lb Bag",
              weight: 907,
              stockQuantity: 65,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 5400 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 100,
              purchaseOptions: {
                create: [
                  { type: "ONE_TIME" as const, priceInCents: 2350 },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 2230,
                    billingInterval: "WEEK" as const,
                    billingIntervalCount: 2,
                  },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 2115,
                    billingInterval: "MONTH" as const,
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 90,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2250 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 140,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 1950 }],
              },
            },
            {
              name: "5lb Bulk Bag",
              weight: 2268,
              stockQuantity: 40,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 11500 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 70,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2150 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 80,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2200 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 95,
              purchaseOptions: {
                create: [
                  { type: "ONE_TIME" as const, priceInCents: 2300 },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 2185,
                    billingInterval: "MONTH" as const,
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 75,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2250 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 50,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2550 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 110,
              purchaseOptions: {
                create: [
                  { type: "ONE_TIME" as const, priceInCents: 2450 },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 2330,
                    billingInterval: "WEEK" as const,
                    billingIntervalCount: 2,
                  },
                  {
                    type: "SUBSCRIPTION" as const,
                    priceInCents: 2205,
                    billingInterval: "MONTH" as const,
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 85,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2650 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 90,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2400 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 60,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2500 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 55,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2450 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 45,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2600 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 25,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 4500 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 30,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 3800 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 65,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2550 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 70,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2400 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 40,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2450 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 20,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 5200 }],
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
        variants: {
          create: [
            {
              name: "12oz Bag",
              weight: 340,
              stockQuantity: 50,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2350 }],
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
        variants: {
          create: [
            {
              name: "8oz Bag",
              weight: 227,
              stockQuantity: 35,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 4800 }],
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

  const minimalData = [
    coffeeData[0],
    {
      product: {
        name: "Artisan Canvas Tote",
        slug: "artisan-canvas-tote",
        description:
          "Heavyweight canvas tote for bean runs and local deliveries. 16oz canvas, reinforced handles, fits two 2lb bags plus extras.",
        origin: [],
        tastingNotes: [],
        isOrganic: false,
        isFeatured: true,
        featuredOrder: 99,
        variants: {
          create: [
            {
              name: "One Size",
              weight: 0,
              stockQuantity: 50,
              purchaseOptions: {
                create: [{ type: "ONE_TIME" as const, priceInCents: 2200 }],
              },
            },
          ],
        },
      },
      categories: catMerch
        ? [{ categoryId: catMerch.id, isPrimary: true }]
        : [],
    },
  ];

  const productsToSeed = isMinimal ? minimalData : coffeeData;

  // Create products
  for (const item of productsToSeed) {
    const { product: productInput, categories: categoryLinks } = item;

    const isMerch = categoryLinks.some((l) => l.categoryId === catMerch?.id);
    const productType = isMerch ? ProductType.MERCH : ProductType.COFFEE;

    // Determine roast level (non-coffee merch stays MEDIUM default)
    let roastLevel: RoastLevel = RoastLevel.MEDIUM;
    if (categoryLinks.some((l) => l.categoryId === catDark?.id)) {
      roastLevel = RoastLevel.DARK;
    } else if (categoryLinks.some((l) => l.categoryId === catLight?.id)) {
      roastLevel = RoastLevel.LIGHT;
    }

    // Determine categories based on origin; allow explicit categoryLinks for non-coffee
    const newCategories: Array<{ categoryId: string; isPrimary: boolean }> = [];
    const origins = productInput.origin;
    const isMicroLot = categoryLinks.some(
      (l) => l.categoryId === catMicroLot?.id
    );

    if (origins.length === 1) {
      const originCategory = originCategories[origins[0]];
      if (originCategory) {
        newCategories.push({ categoryId: originCategory.id, isPrimary: true });
      } else {
        newCategories.push({ categoryId: catSingleOrigin.id, isPrimary: true });
      }
    } else if (origins.length > 1) {
      newCategories.push({ categoryId: catBlends.id, isPrimary: true });
    } else if (categoryLinks.length > 0) {
      newCategories.push(...categoryLinks);
    } else {
      newCategories.push({ categoryId: catBlends.id, isPrimary: true });
    }

    // Add roast level as secondary for coffee items only (origin data present)
    if (origins.length > 0) {
      if (roastLevel === RoastLevel.DARK) {
        newCategories.push({ categoryId: catDark.id, isPrimary: false });
      } else if (roastLevel === RoastLevel.LIGHT) {
        newCategories.push({ categoryId: catLight.id, isPrimary: false });
      } else {
        newCategories.push({ categoryId: catMedium.id, isPrimary: false });
      }
    }

    // Add micro lot if applicable
    if (isMicroLot) {
      newCategories.push({ categoryId: catMicroLot.id, isPrimary: false });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: productInput.slug },
      include: { variants: true },
    });

    let _product;
    if (existingProduct) {
      // Update existing product (don't touch variants to avoid FK constraints)
      _product = await prisma.product.update({
        where: { slug: productInput.slug },
        data: {
          name: productInput.name,
          description: productInput.description,
          origin: productInput.origin,
          tastingNotes: productInput.tastingNotes,
          isOrganic: productInput.isOrganic,
          isFeatured: productInput.isFeatured,
          featuredOrder: productInput.featuredOrder,
          type: productType,
          roastLevel,
          // Delete existing images so placeholders are used
          images: { deleteMany: {} },
          categories: {
            deleteMany: {},
            create: newCategories,
          },
        },
      });
    } else {
      // Create new product with variants
      _product = await prisma.product.create({
        data: {
          name: productInput.name,
          slug: productInput.slug,
          description: productInput.description,
          origin: productInput.origin,
          tastingNotes: productInput.tastingNotes,
          isOrganic: productInput.isOrganic,
          isFeatured: productInput.isFeatured,
          featuredOrder: productInput.featuredOrder,
          type: productType,
          roastLevel,
          variants: productInput.variants,
          categories: {
            create: newCategories,
          },
        },
      });
    }
  }

  console.log(
    `    ✓ Seeded ${productsToSeed.length} products (mode: ${productSeedMode})`
  );
}
