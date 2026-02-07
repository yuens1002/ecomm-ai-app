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
        processing: undefined as string | undefined,
        description:
          "Born in our roastery's late-night cupping sessions, this blend marries dry-processed Brazilian Cerrado beans with washed Colombian Huila and wet-hulled Sumatran Mandheling. The Brazilian base brings body and bittersweet chocolate depth, Colombian lots add structured sweetness, and Indonesian beans lend an earthy complexity that rounds the finish. We roast each origin separately to its peak before blending, ensuring layers of toasted hazelnut and caramelized sugar emerge in every espresso pull. Equally stunning as a flat white or cortado.",
        origin: ["Brazil", "Colombia", "Indonesia"],
        tastingNotes: ["Dark Chocolate", "Toasted Hazelnut", "Caramel"],
        variety: "Bourbon, Castillo, Mandheling",
        altitude: "900–1,600m",
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
        processing: undefined as string | undefined,
        description:
          "Our Italian Roast pays homage to the tradition of Southern Italian espresso bars, where bold flavor is non-negotiable. We source high-density Bourbon from Brazil's Sul de Minas highlands and Catuai from Guatemala's Atitlán slopes, then push both past second crack to unlock deep smoky caramelization. The result is a powerful, full-bodied cup with pronounced bittersweet chocolate, roasted almond, and a lingering campfire sweetness. Built for moka pots, Neapolitan flip brewers, and anyone who takes their coffee unapologetically dark.",
        origin: ["Brazil", "Guatemala"],
        tastingNotes: ["Bittersweet Chocolate", "Roasted Almond", "Smoky"],
        variety: "Bourbon, Catuai",
        altitude: "800–1,400m",
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
        processing: "Wet-Hulled (Giling Basah)",
        description:
          "From the volcanic highlands around Lake Toba in North Sumatra, this Mandheling is processed using the traditional Giling Basah wet-hull method unique to Indonesia. Smallholder farmers depulp cherries at their farms, then deliver parchment coffee still damp to local collectors, where it's hulled at high moisture. This unconventional technique produces the distinctively syrupy body and earthy complexity that defines Sumatran coffee. Expect layers of dark chocolate, aromatic cedar, and a lingering herbaceous quality that rewards slow sipping. Certified organic by the Gayo cooperative.",
        origin: ["Indonesia"],
        tastingNotes: ["Earthy", "Dark Chocolate", "Cedar"],
        variety: "Typica, Catimor",
        altitude: "800–1,500m",
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
        processing: undefined as string | undefined,
        description:
          "This is the roast that divides the room—and we love it for that. Sourced from cooperative farms in Colombia's Cauca department and Brazil's Mogiana region, we take these beans deep into second crack where sugars fully caramelize and oils rise to the surface. The result is a velvety, almost viscous body with pronounced dark chocolate, a whisper of charred oak, and a finish so smooth it lingers without bitterness. We sell more of this in our 5lb bulk bags than any other coffee—home baristas and office coffee stations can't get enough.",
        origin: ["Colombia", "Brazil"],
        tastingNotes: ["Dark Chocolate", "Charred Wood", "Smooth"],
        variety: "Bourbon, Catuai",
        altitude: "1,000–1,400m",
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
        processing: "Washed",
        description:
          "Sigri Estate sits in the Wahgi Valley of Papua New Guinea's Western Highlands, one of the most remote fine-coffee regions on Earth. At 1,500 meters, cool nights slow cherry maturation, concentrating sugars in each bean. The estate's meticulous washing process—72-hour underwater fermentation followed by raised-bed drying—produces a remarkably clean cup with unusual depth. Dark berry and cocoa dominate the profile, grounded by an earthy complexity inherited from volcanic soils. Each harvest is limited, and we secure just a few bags annually for our most curious customers.",
        origin: ["Papua New Guinea"],
        tastingNotes: ["Dark Berry", "Cocoa", "Earthy"],
        variety: "Typica, Arusha",
        altitude: "1,500–1,800m",
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
        processing: "Washed, Swiss Water Decaf",
        description:
          "Sourced from family farms in Colombia's Huila department, these Castillo and Caturra beans are fully washed at origin, then shipped green to the Swiss Water facility in Vancouver, where caffeine is removed using pure water—no chemicals, no compromise. The process preserves the inherent sweetness of Colombian highland coffee: silky milk chocolate, toasted hazelnuts, and a gentle caramel finish that makes you forget it's decaf. Perfect for evening pour-overs or anyone who wants great coffee on their own schedule. Subscribers tell us it's the first decaf they've actually looked forward to.",
        origin: ["Colombia"],
        tastingNotes: ["Milk Chocolate", "Toasted Nuts", "Caramel"],
        variety: "Castillo, Caturra",
        altitude: "1,400–1,800m",
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
        processing: undefined as string | undefined,
        description:
          "Our best-selling coffee exists because our head roaster couldn't stop tinkering with her morning cup. She blends washed Caturra from Colombia's Nariño region for sweetness, sun-dried Catuai from Guatemala's Cobán highlands for body, and honey-processed Costa Rican lots from the Tarrazú valley for brightness. The three-origin combination creates a medium roast that's smooth enough to drink on autopilot yet complex enough to reward attention—notes of wildflower honey, roasted almond, and a citrus sparkle on the finish. Our most subscribed coffee by a wide margin.",
        origin: ["Colombia", "Guatemala", "Costa Rica"],
        tastingNotes: ["Honey", "Roasted Almond", "Citrus"],
        variety: "Caturra, Catuai",
        altitude: "1,200–1,600m",
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
        processing: "Washed",
        description:
          "Supremo is Colombia's highest screen-size grade, meaning only the largest, densest beans make the cut. Ours comes from smallholder farms scattered across Huila's mountainous terrain, where volcanic soil and equatorial sun produce cherries bursting with sugar. After careful hand-picking, beans are fully washed and patio-dried over two weeks. The cup is everything you want from a classic Colombian—well-balanced medium body, a caramel sweetness that builds as it cools, clean cocoa undertones, and a finish that lingers pleasantly without overstaying. A staple that never disappoints, whether brewed as drip, Chemex, or Aeropress.",
        origin: ["Colombia"],
        tastingNotes: ["Caramel", "Cocoa", "Sweet"],
        variety: "Castillo, Caturra",
        altitude: "1,400–1,800m",
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
        processing: "Washed",
        description:
          "The Antigua valley sits cradled between three volcanoes—Agua, Fuego, and Acatenango—whose mineral-rich ash has enriched the soil for centuries. Our lot comes from a fourth-generation family estate at 1,600 meters, where shade-grown Bourbon and Caturra cherries ripen slowly under a canopy of Gravilea trees. After selective hand-picking, beans are fully washed in spring-fed channels and dried on clay patios under the Guatemalan sun. The cup reveals a rich body with dark stone fruit, milk chocolate sweetness, and a subtle volcanic smokiness that makes Antigua one of the world's most celebrated origins. Certified organic.",
        origin: ["Guatemala"],
        tastingNotes: ["Dark Fruit", "Milk Chocolate", "Smoky"],
        variety: "Bourbon, Caturra",
        altitude: "1,500–1,700m",
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
        processing: "Washed",
        description:
          "The Tarrazú canton in Costa Rica's Los Santos region consistently produces some of Central America's cleanest, brightest coffees. Our lot is sourced from the CoopeTarrazú cooperative, where over 3,500 smallholder families pool their harvests. Grown between 1,200 and 1,900 meters on steep volcanic hillsides, these Caturra and Catuai cherries benefit from dramatic temperature swings between day and night. Fully washed and sun-dried on raised African beds, the result is a sparkling cup with brown sugar sweetness, ripe stone fruit, and a crisp, almost tea-like finish that makes it ideal for pour-over brewing.",
        origin: ["Costa Rica"],
        tastingNotes: ["Brown Sugar", "Stone Fruit", "Crisp"],
        variety: "Caturra, Catuai",
        altitude: "1,200–1,900m",
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
        processing: "Natural (Dry Process)",
        description:
          "Named after the port of Santos through which most Brazilian coffee has shipped for centuries, this lot comes from fazendas in the Cerrado Mineiro region of Minas Gerais. The flat, sun-drenched plateaus here are ideal for natural processing, where whole cherries dry on concrete patios for three weeks, allowing fruit sugars to ferment gently into the bean. The result is a silky, low-acid cup with roasted peanut, milk chocolate, and a subtle dried fruit sweetness. We sell this in 5lb bulk bags because it's our most popular cold brew base—steep it overnight and you'll understand why.",
        origin: ["Brazil"],
        tastingNotes: ["Nutty", "Chocolate", "Low Acidity"],
        variety: "Bourbon, Mundo Novo",
        altitude: "800–1,200m",
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
        processing: "Washed",
        description:
          "Marcala was Honduras's first Denomination of Origin for coffee, and for good reason. Nestled in the department of La Paz at elevations above 1,300 meters, the region's cloud forests create a micro-climate where Catuai and Bourbon varieties develop slowly over nine months. Our lot comes from the COMSA cooperative, a group of indigenous Lenca farmers who practice agroforestry and shade-growing. Fully washed and dried on raised beds, this coffee delivers toffee sweetness, crisp red apple acidity, and a citrus zest finish that brightens any morning routine.",
        origin: ["Honduras"],
        tastingNotes: ["Toffee", "Red Apple", "Citrus Zest"],
        variety: "Catuai, Bourbon",
        altitude: "1,300–1,700m",
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
        processing: "Washed",
        description:
          "\"Altura\" means highland in Spanish, and this designation guarantees beans grown above 1,200 meters in Mexico's Sierra Madre mountains. Our lot comes from organic-certified cooperatives in Chiapas, near the Guatemalan border, where indigenous Mayan farming communities have cultivated coffee under native forest canopy for generations. The Typica and Bourbon varieties here produce a lighter body than most Latin American coffees, with bright acidity carrying notes of cocoa powder, toasted cashew, and a warming cinnamon-like spice on the finish. A crowd-pleaser that converts tea drinkers.",
        origin: ["Mexico"],
        tastingNotes: ["Cocoa", "Roasted Nuts", "Spice"],
        variety: "Typica, Bourbon",
        altitude: "1,200–1,700m",
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
        processing: "Washed",
        description:
          "High in the Andes of Peru's Cajamarca region, the Cenfrocafé cooperative brings together over 2,000 smallholder families who farm organically by tradition as much as by certification. At these altitudes—above 1,400 meters—frost is a real risk, but the payoff is beans with extraordinary density and sweetness. Fully washed in mountain spring water and slow-dried on tarps at altitude, this coffee delivers a mellow, velvety cup: vanilla bean sweetness up front, a caramel mid-palate, and a fleeting jasmine-like floral note on the finish. Our go-to recommendation for anyone new to specialty coffee.",
        origin: ["Peru"],
        tastingNotes: ["Vanilla", "Caramel", "Floral"],
        variety: "Typica, Caturra",
        altitude: "1,400–1,800m",
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
        processing: "Washed",
        description:
          "\"Strictly High Grown\" is the highest grade designation for Nicaraguan coffee, reserved for beans cultivated above 1,200 meters. Our SHG comes from the Jinotega highlands, where morning fog and afternoon rain create ideal growing conditions for Caturra and Bourbon varieties. Small family farms here often sit on former cloud forest land, and many are transitioning back to shade-grown systems. Washed and patio-dried, this coffee offers a beautifully balanced cup—creamy milk chocolate body, sticky orange marmalade sweetness, and a round, satisfying finish that works brilliantly as both drip and espresso.",
        origin: ["Nicaragua"],
        tastingNotes: ["Milk Chocolate", "Orange Marmalade", "Creamy"],
        variety: "Caturra, Bourbon",
        altitude: "1,200–1,600m",
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
        processing: "Honey",
        description:
          "Pacamara is a hybrid variety bred in El Salvador in the 1950s—a cross between the giant-beaned Pacas and Maragogype cultivars. Our lot comes from Finca Santa Petrona on the slopes of the Santa Ana volcano, where the Pacas family has farmed coffee for five generations. These oversized beans are honey-processed: depulped but dried with their sticky mucilage intact, creating a natural sweetness that conventional washing would strip away. The cup is gloriously complex—ripe mango and passionfruit up front, raw honeycomb sweetness in the middle, and a burgundy wine-like acidity that keeps you reaching for another sip.",
        origin: ["El Salvador"],
        tastingNotes: ["Tropical Fruit", "Honey", "Wine-like"],
        variety: "Pacamara",
        altitude: "1,200–1,600m",
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
        processing: "Washed",
        description:
          "Yirgacheffe is where coffee's story begins—the Kaffa forests of southern Ethiopia, where Coffea arabica still grows wild. Our lot comes from washing stations in the Gedeo Zone, where thousands of garden farmers deliver hand-picked cherries from heirloom varieties that have never been formally catalogued. After 36-hour fermentation in stone tanks, beans are washed in channels fed by highland springs and dried slowly on raised beds. The result is ethereal: tea-like body, pronounced jasmine and honeysuckle florals, bright lemon acidity, and a bergamot finish that evokes Earl Grey. Certified organic by the Yirgacheffe Coffee Farmers Cooperative Union.",
        origin: ["Ethiopia"],
        tastingNotes: ["Floral", "Lemon", "Bergamot"],
        variety: "Heirloom",
        altitude: "1,700–2,200m",
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
        processing: "Washed (Double Fermented)",
        description:
          "Kenya's AA designation refers to bean size—screen 17/18, the largest grade—but size alone doesn't explain why Kenyan coffee commands a premium. Our lot comes from cooperatives around Mount Kenya, where SL28 and SL34 cultivars (developed at the Scott Laboratories in the 1930s) thrive in the deep red volcanic soil. Kenya's signature double-fermentation wash process—24 hours dry, then 24 hours submerged—creates the intense, almost electric acidity the origin is famous for. Blackcurrant and pink grapefruit dominate the cup, with a savory tomato sweetness and syrupy body that competition judges consistently score in the 90s.",
        origin: ["Kenya"],
        tastingNotes: ["Blackcurrant", "Grapefruit", "Tomato"],
        variety: "SL28, SL34",
        altitude: "1,500–2,100m",
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
        processing: "Natural (Dry Process)",
        description:
          "While neighboring Yirgacheffe gets the spotlight, Sidamo (now officially Sidama) has its own magic. Our natural-processed lot comes from smallholder farms near the town of Bensa, where cherries are dried whole on raised beds for up to three weeks. This patience pays off: the extended fruit contact produces an explosion of ripe blueberry flavor that's almost jam-like in intensity. Beneath that fruit-forward punch, you'll find delicate jasmine florals and a dark chocolate bass note that grounds the cup. This is the coffee that converts washed-coffee purists to the natural-process camp.",
        origin: ["Ethiopia"],
        tastingNotes: ["Blueberry", "Jasmine", "Dark Chocolate"],
        variety: "Heirloom",
        altitude: "1,500–2,200m",
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
        processing: "Washed",
        description:
          "Rwanda's coffee industry has been transformed over the past two decades, and lots like this show why. Grown by members of the Buf Coffee cooperative near Lake Kivu, these Bourbon trees sit at nearly 2,000 meters in rich volcanic soil. Every cherry is hand-sorted for ripeness before going through a meticulous 18-hour fermentation and channel-wash process. The resulting cup has a silky, almost creamy body unusual for a washed African coffee, with bright cranberry and pomegranate acidity, a caramel sweetness that deepens as it cools, and a fleeting rose-petal floral note. Certified organic and Rainforest Alliance verified.",
        origin: ["Rwanda"],
        tastingNotes: ["Red Fruit", "Caramel", "Floral"],
        variety: "Bourbon",
        altitude: "1,500–2,000m",
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
        processing: "Washed",
        description:
          "Kayanza province in northern Burundi shares a border and a terroir with Rwanda, but its coffees have a character all their own. Our lot is processed at the Mpanga washing station, where local farmers—many of them women who head their households—deliver cherry daily during the three-month harvest season. Beans are fermented for 12 hours, washed in fresh spring water from the Kibira forest, and dried on elevated tables under mesh shade cloth. The cup is pristine: tart Bing cherry acidity, bittersweet cocoa nib depth, and a tangy, almost citric finish that makes this one of our team's favorite pour-over picks.",
        origin: ["Burundi"],
        tastingNotes: ["Cherry", "Cocoa Nibs", "Tangy"],
        variety: "Bourbon",
        altitude: "1,700–2,000m",
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
        processing: "Washed",
        description:
          "Peaberries are a natural mutation where only one seed develops inside the coffee cherry instead of the usual two, creating a small, round bean that roasts more evenly and concentrates flavor. Ours come from smallholder farms on the southern slopes of Mount Kilimanjaro, where Bourbon and Kent varieties grow in the shadow of Africa's tallest peak. Hand-sorted to isolate true peaberries (only 5-10% of any harvest), then washed and dried on raised beds in the cool mountain air. The cup is vivid and electric—black currant intensity, Meyer lemon brightness, and a complex, winey depth that reminds you great coffee is, after all, a fruit.",
        origin: ["Tanzania"],
        tastingNotes: ["Black Currant", "Citrus", "Winey"],
        variety: "Bourbon, Kent",
        altitude: "1,400–1,800m",
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
        processing: "Washed",
        description:
          "The Gesha variety was collected from Ethiopia's Gori Gesha forest in the 1930s but languished in obscurity until Hacienda La Esmeralda in Boquete, Panama entered it in competition in 2004—and shattered every price record. Our micro-lot comes from a neighboring estate in the Chiriquí highlands, where Gesha trees grow slowly at 1,800 meters in misty, cool conditions that few other varieties could tolerate. Washed with surgical precision and dried in temperature-controlled rooms, the cup is otherworldly: waves of jasmine and orange blossom, ripe papaya and lychee, and a raw acacia honey sweetness. This is coffee at its most transcendent. Certified organic.",
        origin: ["Panama"],
        tastingNotes: ["Jasmine", "Tropical Fruit", "Honey"],
        variety: "Gesha",
        altitude: "1,600–1,900m",
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
        processing: "Washed",
        description:
          "Colombia has emerged as an unexpected champion of the Gesha variety, and our lot from Finca El Paraíso in Cauca department shows why. Farmer Hugo Carvajal planted Gesha seeds at 2,000 meters—higher than almost any farm in the country—where nighttime temperatures drop near freezing, drastically slowing cherry development and concentrating sugars over a 10-month growing cycle. Washed in controlled fermentation tanks with precise temperature monitoring, the result is a perfumed, almost ethereal cup: ripe white peach, dried lavender, and a brown sugar sweetness that builds through a long, clean finish. Limited availability each season.",
        origin: ["Colombia"],
        tastingNotes: ["Peach", "Lavender", "Brown Sugar"],
        variety: "Gesha",
        altitude: "1,800–2,100m",
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
        processing: "Red Honey",
        description:
          "Costa Rica pioneered the honey process, and this red honey lot from the West Valley's Naranjo micro-region is a masterclass in the technique. After depulping, about 50% of the mucilage is left on the bean during drying—more than yellow honey but less than black—creating a controlled fermentation that takes 15-18 days on raised beds. Farm manager Doña María turns the beans by hand every 45 minutes during peak drying hours to prevent over-fermentation. The payoff is extraordinary: candied apricot sweetness, raw buckwheat honey depth, and a syrupy, almost liqueur-like body that clings to the palate. A process-driven coffee that tastes nothing like its washed neighbor.",
        origin: ["Costa Rica"],
        tastingNotes: ["Apricot", "Honey", "Syrupy"],
        variety: "Caturra, Catuai",
        altitude: "1,200–1,700m",
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
        processing: "Washed",
        description:
          "Huehuetenango is Guatemala's highest coffee-growing region, and its remoteness has been both a challenge and a blessing. Hot, dry winds from Mexico's Tehuantepec plain blow through the valley, protecting these high-altitude farms from frost and allowing cultivation up to 2,000 meters—higher than almost anywhere else in Central America. Our lot comes from the Huehue cooperative's indigenous Q'anjob'al farming communities, who grow Bourbon and Caturra under traditional milpa shade systems. Fully washed in river water and sun-dried on patios, the cup is refined and delicate: crisp Fuji apple acidity, toasted almond sweetness, and an almost crystalline clean finish. Certified organic.",
        origin: ["Guatemala"],
        tastingNotes: ["Apple", "Almond", "Clean"],
        variety: "Bourbon, Caturra",
        altitude: "1,500–2,000m",
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
        processing: "Washed",
        description:
          "Bolivia produces less than 0.1% of the world's coffee, making any Bolivian lot a genuine rarity. Ours comes from the Caranavi province in the Yungas valley—a steep, lush corridor where the Andes drop into the Amazon basin. Small family plots carved into near-vertical hillsides grow Caturra and Catuai at elevations up to 1,800 meters, picking cherry by hand because the terrain makes machinery impossible. Washed in improvised micro-mills and dried on the farmers' own patios, this coffee has a delicate sweetness—milk chocolate and mandarin orange—wrapped in a silky, almost satiny body that belies its humble processing origins.",
        origin: ["Bolivia"],
        tastingNotes: ["Milk Chocolate", "Orange", "Silky"],
        variety: "Caturra, Catuai",
        altitude: "1,400–1,800m",
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
        processing: "Natural (Dry Process)",
        description:
          "Yemen is where the global coffee trade began, and remarkably little has changed in how it's grown here. Terraced into the steep mountainsides of the Haraz region at altitudes above 2,000 meters, ancient Typica landraces—varieties found nowhere else on Earth—are tended by families who've farmed the same plots for centuries. Water scarcity means cherries are always natural-processed, dried on rooftops in the fierce Arabian sun. The result is untamed and complex: candied date and dried fig sweetness, bitter chocolate depth, cardamom and cinnamon spice, and a winey acidity that harkens back to the port of Mocha's storied past. Our most limited and expensive single origin.",
        origin: ["Yemen"],
        tastingNotes: ["Dried Fruit", "Chocolate", "Spice"],
        variety: "Typica (Yemeni landraces)",
        altitude: "1,500–2,500m",
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
        processing: "Monsooned",
        description:
          "This is one of the most unusual coffees in our lineup, born from a historical accident. In the days of sailing ships, green coffee beans traveling from India to Europe would swell and change character during months of exposure to monsoon moisture in cargo holds. When steamships shortened the journey, the distinctive flavor was lost—so Malabar coast producers began deliberately recreating the process. Our beans are spread in open-sided warehouses during the June-September monsoon, absorbing humid winds off the Arabian Sea for 12-16 weeks. The transformation is dramatic: near-zero acidity, a heavy, almost chewy body, and flavors of pipe tobacco, black pepper, and loamy earth. Not for everyone, but unforgettable for those who love it.",
        origin: ["India"],
        tastingNotes: ["Earthy", "Tobacco", "Spice"],
        variety: "Robusta, Kent",
        altitude: "900–1,200m",
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
        processing: "Washed",
        description:
          "Kona coffee grows on a narrow strip of volcanic hillside on Hawaii's Big Island, where the slopes of Hualalai and Mauna Loa create a micro-climate found nowhere else—morning sun, afternoon cloud cover, and mineral-rich lava soil. Our 100% Kona (never a blend) comes from a third-generation family farm in the Holualoa district, where Typica trees descended from the original Brazilian cuttings brought to Hawaii in 1828 still produce exceptional cherry. Fully washed and sun-dried on traditional hoshidanas (wooden drying decks), the cup is refined and aromatic: brown sugar and roasted macadamia nut sweetness, medium body, and a bright, clean finish that justifies Kona's reputation as America's finest coffee.",
        origin: ["Hawaii"],
        tastingNotes: ["Brown Sugar", "Macadamia Nut", "Clean"],
        variety: "Typica",
        altitude: "150–900m",
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
        processing: undefined as string | undefined,
        description:
          "Heavyweight canvas tote for bean runs and local deliveries. 16oz canvas, reinforced handles, fits two 2lb bags plus extras.",
        origin: [],
        tastingNotes: [],
        variety: undefined as string | undefined,
        altitude: undefined as string | undefined,
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

    // Determine roast level (null for non-coffee products)
    let roastLevel: RoastLevel | null = null;
    if (!isMerch) {
      if (categoryLinks.some((l) => l.categoryId === catDark?.id)) {
        roastLevel = RoastLevel.DARK;
      } else if (categoryLinks.some((l) => l.categoryId === catLight?.id)) {
        roastLevel = RoastLevel.LIGHT;
      } else {
        roastLevel = RoastLevel.MEDIUM;
      }
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
          variety: productInput.variety ?? null,
          altitude: productInput.altitude ?? null,
          processing: productInput.processing ?? null,
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
          variety: productInput.variety ?? null,
          altitude: productInput.altitude ?? null,
          processing: productInput.processing ?? null,
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

  // --- Coffee → Merch add-on links ---
  if (isMinimal) return;

  console.log("  🔗 Seeding coffee → merch add-on links...");

  // Pairing rules:
  //   Light roasts        → Origami Air Dripper + Origami Cone Filters
  //   Dark roasts         → Cold Brew Bottle + Heritage Diner Mug
  //   Premium mediums     → Cupping Spoon + Timemore Scale
  //   Everyday mediums    → Airscape Canister + Barista Towel
  const coffeeAddOnLinks: Array<{
    coffeeSlugs: string[];
    addOnSlugs: string[];
  }> = [
    {
      coffeeSlugs: [
        "ethiopian-sidamo",
        "ethiopian-yirgacheffe",
        "guatemala-huehuetenango",
      ],
      addOnSlugs: ["origami-air-dripper", "origami-cone-filters"],
    },
    {
      coffeeSlugs: [
        "decaf-colombian",
        "french-roast",
        "italian-roast",
        "midnight-espresso-blend",
        "sumatra-mandheling",
      ],
      addOnSlugs: ["cold-brew-bottle", "heritage-diner-mug"],
    },
    {
      coffeeSlugs: [
        "kenya-aa",
        "panama-geisha",
        "colombia-geisha",
        "hawaiian-kona",
      ],
      addOnSlugs: ["cupping-spoon", "timemore-black-mirror-scale"],
    },
    {
      coffeeSlugs: [
        "breakfast-blend",
        "brazil-santos",
        "colombian-supremo",
      ],
      addOnSlugs: ["airscape-coffee-canister", "barista-towel-2-pack"],
    },
  ];

  // Resolve slugs to product + first variant IDs
  const resolveSlug = async (slug: string) => {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { variants: { take: 1 } },
    });
    if (!product || product.variants.length === 0) return null;
    return { productId: product.id, variantId: product.variants[0].id };
  };

  let coffeeAddOnCount = 0;

  for (const group of coffeeAddOnLinks) {
    for (const coffeeSlug of group.coffeeSlugs) {
      const coffee = await resolveSlug(coffeeSlug);
      if (!coffee) continue;

      // Clean existing coffee add-on links for this product
      await prisma.addOnLink.deleteMany({
        where: { primaryProductId: coffee.productId },
      });

      for (const addOnSlug of group.addOnSlugs) {
        const addOn = await resolveSlug(addOnSlug);
        if (!addOn) continue;

        await prisma.addOnLink.create({
          data: {
            primaryProductId: coffee.productId,
            primaryVariantId: coffee.variantId,
            addOnProductId: addOn.productId,
            addOnVariantId: addOn.variantId,
          },
        });
        coffeeAddOnCount++;
      }
    }
  }

  console.log(`    ✓ Seeded ${coffeeAddOnCount} coffee add-on links`);
}
