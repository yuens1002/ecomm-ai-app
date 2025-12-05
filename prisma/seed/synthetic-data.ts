import { PrismaClient, ActivityType } from "@prisma/client";

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

export async function seedSyntheticData(prisma: PrismaClient) {
  console.log("  🎭 Creating synthetic user behavior data...");

  // Get existing users and products
  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany({
    include: {
      variants: { include: { purchaseOptions: true } },
      categories: { include: { category: true } },
    },
  });

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
    const orderCount = randomInt(0, 3); // 0-3 orders per user
    for (let i = 0; i < orderCount; i++) {
      const orderProducts = [];
      const numItems = randomInt(1, 4); // 1-4 items per order

      for (let j = 0; j < numItems; j++) {
        const product = randomElement(products);
        const variant = randomElement(product.variants);
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

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          status: "SHIPPED",
          totalInCents: totalAmount,
          deliveryMethod: "DELIVERY",
          shippingStreet: `${randomInt(100, 9999)} Main St`,
          shippingCity: randomElement([
            "Seattle",
            "Portland",
            "San Francisco",
            "Los Angeles",
            "Austin",
          ]),
          shippingState: randomElement(["WA", "OR", "CA", "TX"]),
          shippingPostalCode: `${randomInt(10000, 99999)}`,
          shippingCountry: "US",
          items: {
            create: orderProducts.map((item) => ({
              purchaseOptionId: item.purchaseOptionId,
              quantity: item.quantity,
              priceInCents: item.unitPrice,
            })),
          },
          createdAt: daysAgo(randomInt(1, 60)),
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
