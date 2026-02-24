import { PrismaClient, ActivityType, OrderStatus, DeliveryMethod } from "@prisma/client";

// --- User Personas for Realistic Behavior ---
const PERSONAS = {
  ESPRESSO_LOVER: {
    preferredRoast: "dark-roast",
    searchQueries: [
      "dark espresso",
      "espresso blend",
      "bold coffee",
      "italian roast",
    ],
    productPreferences: ["espresso", "dark", "bold", "italian"],
  },
  LIGHT_ROAST_EXPLORER: {
    preferredRoast: "light-roast",
    searchQueries: [
      "fruity coffee",
      "light roast",
      "ethiopian",
      "floral coffee",
    ],
    productPreferences: ["yirgacheffe", "kenya", "ethiopia", "light"],
  },
  BALANCED_DRINKER: {
    preferredRoast: "medium-roast",
    searchQueries: [
      "medium roast",
      "breakfast blend",
      "smooth coffee",
      "colombia",
    ],
    productPreferences: ["colombia", "guatemala", "medium", "breakfast"],
  },
  ADVENTUROUS_TASTER: {
    preferredRoast: null, // Tries everything
    searchQueries: [
      "rare coffee",
      "micro lot",
      "geisha",
      "unique coffee",
      "honey process",
    ],
    productPreferences: ["geisha", "micro", "panama", "yemen", "anaerobic"],
  },
  SUBSCRIPTION_CUSTOMER: {
    preferredRoast: "medium-roast",
    searchQueries: ["subscription coffee", "monthly coffee", "coffee delivery"],
    productPreferences: ["subscription", "blend", "colombia", "organic"],
  },
};

const FAKE_NAMES = [
  "Alex Rivera", "Jordan Lee", "Morgan Patel", "Casey Kim",
  "Taylor Brooks", "Quinn Nguyen", "Avery Santos", "Riley Cooper",
  "Jamie Ortiz", "Drew Campbell", "Sam Nakamura", "Chris Delgado",
  "Hayden Park", "Reese Johansen", "Dakota Tran", "Emery Washington",
];

const STREET_NAMES = [
  "Main St", "Oak Ave", "Elm Dr", "Cedar Ln", "Pine Rd",
  "Maple Way", "Birch Ct", "Walnut Blvd", "Spruce Pl", "Willow St",
  "Highland Ave", "Lakeview Dr", "Sunset Blvd", "Park Pl", "River Rd",
];

// City/state/zip tuples so addresses are geographically consistent
const CITY_STATE_ZIP = [
  { city: "Seattle", state: "WA", zip: "98101" },
  { city: "Tacoma", state: "WA", zip: "98402" },
  { city: "Portland", state: "OR", zip: "97201" },
  { city: "Eugene", state: "OR", zip: "97401" },
  { city: "San Francisco", state: "CA", zip: "94102" },
  { city: "Los Angeles", state: "CA", zip: "90001" },
  { city: "San Diego", state: "CA", zip: "92101" },
  { city: "Austin", state: "TX", zip: "73301" },
  { city: "Denver", state: "CO", zip: "80201" },
  { city: "Chicago", state: "IL", zip: "60601" },
  { city: "Brooklyn", state: "NY", zip: "11201" },
  { city: "Boston", state: "MA", zip: "02101" },
];

// --- Helper Functions ---
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Weighted status distribution: 60% SHIPPED, 15% PENDING, 10% PICKED_UP, 10% CANCELLED, 5% FAILED
const WEIGHTED_STATUSES: OrderStatus[] = [
  ...Array(12).fill(OrderStatus.SHIPPED),
  ...Array(3).fill(OrderStatus.PENDING),
  ...Array(2).fill(OrderStatus.PICKED_UP),
  ...Array(2).fill(OrderStatus.CANCELLED),
  ...Array(1).fill(OrderStatus.FAILED),
];

export async function seedSyntheticData(prisma: PrismaClient) {
  console.log("  🎭 Creating synthetic user behavior data...");

  // Get existing users and products
  const users = await prisma.user.findMany();
  const allProducts = await prisma.product.findMany({
    include: {
      variants: { include: { purchaseOptions: true } },
      categories: { include: { category: true } },
    },
  });

  // Filter to only products with valid variants and purchase options
  const products = allProducts.filter(
    (p) =>
      p.variants.length > 0 &&
      p.variants.some((v) => v.purchaseOptions.length > 0)
  );

  if (users.length === 0 || products.length === 0) {
    throw new Error(
      "Users and products must be seeded first. Run seedUsers and seedProducts first."
    );
  }

  // --- Seed Newsletter Subscribers ---
  const newsletterSeeds = [
    { email: "coffeelover@example.com", daysAgoValue: 1, isActive: true },
    { email: "morningbrew@example.com", daysAgoValue: 2, isActive: true },
    { email: "espressofan@example.com", daysAgoValue: 3, isActive: true },
    { email: "singleoriginfan@example.com", daysAgoValue: 5, isActive: true },
    { email: "espressofanatic@example.com", daysAgoValue: 9, isActive: true },
    { email: "pouroversarah@example.com", daysAgoValue: 12, isActive: true },
    { email: "decafdan@example.com", daysAgoValue: 15, isActive: true },
    { email: "weeklybeans@example.com", daysAgoValue: 18, isActive: true },
    { email: "travelingtaster@example.com", daysAgoValue: 21, isActive: false },
    { email: "seasonalsips@example.com", daysAgoValue: 24, isActive: true },
    { email: "palatepilot@example.com", daysAgoValue: 30, isActive: false },
  ];

  for (const seed of newsletterSeeds) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: seed.email },
      update: {
        isActive: seed.isActive,
        subscribedAt: daysAgo(seed.daysAgoValue),
      },
      create: {
        email: seed.email,
        isActive: seed.isActive,
        subscribedAt: daysAgo(seed.daysAgoValue),
      },
    });
  }

  console.log(`    ✓ Seeded ${newsletterSeeds.length} newsletter subscribers`);

  // --- Demo user: one order per status ---
  const demoUser = users.find((u) => u.email === "demo@artisanroast.com");
  if (demoUser) {
    const demoProduct = products[0];
    const demoVariant = demoProduct.variants.find(
      (v) => v.purchaseOptions.length > 0
    )!;
    const demoPo = demoVariant.purchaseOptions[0];
    const demoLocation = CITY_STATE_ZIP[0]; // Seattle

    const demoStatuses: Array<{
      status: OrderStatus;
      deliveryMethod: DeliveryMethod;
      daysAgoCreated: number;
      carrier?: string;
      trackingNumber?: string;
      shippedAt?: Date;
      deliveredAt?: Date;
    }> = [
      { status: "PENDING", deliveryMethod: "DELIVERY", daysAgoCreated: 0 },
      {
        status: "SHIPPED",
        deliveryMethod: "DELIVERY",
        daysAgoCreated: 2,
        carrier: "USPS",
        trackingNumber: "a-real-fake-tracking-#-from-glance",
        shippedAt: daysAgo(1),
      },
      {
        status: "OUT_FOR_DELIVERY",
        deliveryMethod: "DELIVERY",
        daysAgoCreated: 3,
        carrier: "USPS",
        trackingNumber: "a-real-fake-tracking-#-from-glance",
        shippedAt: daysAgo(2),
      },
      {
        status: "DELIVERED",
        deliveryMethod: "DELIVERY",
        daysAgoCreated: 7,
        carrier: "USPS",
        trackingNumber: "a-real-fake-tracking-#-from-glance",
        shippedAt: daysAgo(5),
        deliveredAt: daysAgo(3),
      },
      { status: "PICKED_UP", deliveryMethod: "PICKUP", daysAgoCreated: 10 },
      { status: "CANCELLED", deliveryMethod: "DELIVERY", daysAgoCreated: 14 },
      { status: "FAILED", deliveryMethod: "DELIVERY", daysAgoCreated: 21 },
    ];

    for (const ds of demoStatuses) {
      await prisma.order.create({
        data: {
          userId: demoUser.id,
          status: ds.status,
          totalInCents: demoPo.priceInCents + 500,
          deliveryMethod: ds.deliveryMethod,
          recipientName: demoUser.name || "Demo User",
          shippingStreet: `${randomInt(100, 9999)} ${randomElement(STREET_NAMES)}`,
          shippingCity: demoLocation.city,
          shippingState: demoLocation.state,
          shippingPostalCode: demoLocation.zip,
          shippingCountry: "US",
          customerEmail: demoUser.email,
          ...(ds.carrier && { carrier: ds.carrier }),
          ...(ds.trackingNumber && { trackingNumber: ds.trackingNumber }),
          ...(ds.shippedAt && { shippedAt: ds.shippedAt }),
          ...(ds.deliveredAt && { deliveredAt: ds.deliveredAt }),
          items: {
            create: [
              {
                purchaseOptionId: demoPo.id,
                quantity: 1,
                priceInCents: demoPo.priceInCents,
              },
            ],
          },
          createdAt: daysAgo(ds.daysAgoCreated),
        },
      });
    }

    console.log(
      `    ✓ Created ${demoStatuses.length} demo orders for ${demoUser.email}`
    );
  }

  // --- Generate User Activities and Orders ---
  let totalActivities = 0;
  let totalOrders = 0;

  for (const user of users) {
    const sessionId = generateSessionId();
    const activityCount = randomInt(3, 15); // Each user generates 3-15 activities
    const daysActive = randomInt(1, 60); // Active within last 60 days

    // Generate page views and interactions
    for (let i = 0; i < activityCount; i++) {
      const activityType = randomElement([
        ActivityType.PAGE_VIEW,
        ActivityType.PRODUCT_VIEW,
        ActivityType.SEARCH,
        ActivityType.ADD_TO_CART,
      ]);

      if (activityType === ActivityType.PRODUCT_VIEW) {
        const product = randomElement(products);
        await prisma.userActivity.create({
          data: {
            sessionId,
            userId: user.id,
            activityType,
            productId: product.id,
            source: randomElement([
              "category-page",
              "search-results",
              "homepage",
            ]),
            createdAt: daysAgo(randomInt(0, daysActive)),
          },
        });
      } else if (activityType === ActivityType.SEARCH) {
        const persona = randomElement(Object.values(PERSONAS));
        await prisma.userActivity.create({
          data: {
            sessionId,
            userId: user.id,
            activityType,
            searchQuery: randomElement(persona.searchQueries),
            source: "homepage",
            createdAt: daysAgo(randomInt(0, daysActive)),
          },
        });
      } else {
        await prisma.userActivity.create({
          data: {
            sessionId,
            userId: user.id,
            activityType,
            source: randomElement([
              "homepage",
              "category-page",
              "search-results",
            ]),
            createdAt: daysAgo(randomInt(0, daysActive)),
          },
        });
      }
    }

    // Generate some orders for active users
    // Guarantee at least 1 order for the first 2 users (for demo statuses)
    const orderCount = totalOrders < 2 ? randomInt(1, 3) : randomInt(0, 3);
    for (let i = 0; i < orderCount; i++) {
      const orderProducts = [];
      const numItems = randomInt(1, 4); // 1-4 items per order

      for (let j = 0; j < numItems; j++) {
        const product = randomElement(products);
        const validVariants = product.variants.filter(
          (v) => v.purchaseOptions.length > 0
        );
        if (validVariants.length === 0) continue;
        const variant = randomElement(validVariants);
        const purchaseOption = randomElement(variant.purchaseOptions);

        orderProducts.push({
          productId: product.id,
          variantId: variant.id,
          purchaseOptionId: purchaseOption.id,
          quantity: randomInt(1, 3),
          unitPrice: purchaseOption.priceInCents,
        });
      }

      const subtotal = orderProducts.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      const taxAmount = Math.round(subtotal * 0.08); // 8% tax
      const shippingAmount = randomInt(0, 1500); // $0-15 shipping
      const totalAmount = subtotal + taxAmount + shippingAmount;

      const location = randomElement(CITY_STATE_ZIP);

      // First order: OUT_FOR_DELIVERY, second: SHIPPED, rest: DELIVERED
      const orderStatus =
        totalOrders === 0
          ? "OUT_FOR_DELIVERY"
          : totalOrders === 1
            ? "SHIPPED"
            : "DELIVERED";
      const orderCreatedAt =
        totalOrders === 0
          ? daysAgo(1)
          : totalOrders === 1
            ? daysAgo(2)
            : daysAgo(randomInt(5, 60));
      const shippedAt =
        totalOrders === 0
          ? daysAgo(1)
          : totalOrders === 1
            ? daysAgo(1)
            : daysAgo(randomInt(3, 55));

      const _order = await prisma.order.create({
        data: {
          userId: user.id,
          status: orderStatus,
          totalInCents: totalAmount,
          deliveryMethod: "DELIVERY",
          recipientName: user.name || randomElement(FAKE_NAMES),
          shippingStreet: `${randomInt(100, 9999)} ${randomElement(STREET_NAMES)}`,
          shippingCity: location.city,
          shippingState: location.state,
          shippingPostalCode: location.zip,
          shippingCountry: "US",
          carrier: "USPS",
          trackingNumber: "a-real-fake-tracking-#-from-glance",
          shippedAt,
          ...(orderStatus === "DELIVERED" && { deliveredAt: daysAgo(randomInt(1, 3)) }),
          items: {
            create: orderProducts.map((item) => ({
              purchaseOptionId: item.purchaseOptionId,
              quantity: item.quantity,
              priceInCents: item.unitPrice,
            })),
          },
          createdAt: orderCreatedAt,
        },
      });

      totalOrders++;

      // Create cart add activities for ordered items
      for (const item of orderProducts) {
        await prisma.userActivity.create({
          data: {
            sessionId,
            userId: user.id,
            activityType: ActivityType.ADD_TO_CART,
            productId: item.productId,
            source: "product-page",
            createdAt: daysAgo(randomInt(1, 60)),
          },
        });
        totalActivities++;
      }
    }

    totalActivities += activityCount;
  }

  console.log(`    ✓ Generated ${totalActivities} user activities`);
  console.log(`    ✓ Created ${totalOrders} orders`);

  // --- Generate Anonymous Sessions ---
  const anonymousSessionCount = randomInt(20, 50);
  let anonymousActivities = 0;

  for (let i = 0; i < anonymousSessionCount; i++) {
    const sessionId = generateSessionId();
    const activityCount = randomInt(1, 5); // 1-5 activities per anonymous session

    for (let j = 0; j < activityCount; j++) {
      const activityType = randomElement([
        ActivityType.PAGE_VIEW,
        ActivityType.SEARCH,
        ActivityType.PRODUCT_VIEW,
      ]);

      if (activityType === ActivityType.PRODUCT_VIEW) {
        const product = randomElement(products);
        await prisma.userActivity.create({
          data: {
            sessionId,
            userId: null,
            activityType,
            productId: product.id,
            source: randomElement(["category-page", "search-results"]),
            createdAt: daysAgo(randomInt(0, 7)),
          },
        });
      } else if (activityType === ActivityType.SEARCH) {
        const allQueries = Object.values(PERSONAS).flatMap(
          (p) => p.searchQueries
        );
        await prisma.userActivity.create({
          data: {
            sessionId,
            userId: null,
            activityType,
            searchQuery: randomElement(allQueries),
            source: "homepage",
            createdAt: daysAgo(randomInt(0, 7)),
          },
        });
      } else {
        await prisma.userActivity.create({
          data: {
            sessionId,
            userId: null,
            activityType,
            source: randomElement(["homepage", "category-page"]),
            createdAt: daysAgo(randomInt(0, 7)),
          },
        });
      }
      anonymousActivities++;
    }
  }

  console.log(`    ✓ Generated ${anonymousActivities} anonymous activities`);
  console.log(`    ✓ Created ${anonymousSessionCount} anonymous sessions`);
}
