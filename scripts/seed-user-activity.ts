import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, ActivityType, RoastLevel } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --- User Personas ---
const PERSONAS = {
  ESPRESSO_LOVER: {
    preferredRoast: RoastLevel.DARK,
    searchQueries: ["dark espresso", "espresso blend", "bold coffee", "italian roast"],
    productPreferences: ["espresso", "dark", "bold", "italian"],
  },
  LIGHT_ROAST_EXPLORER: {
    preferredRoast: RoastLevel.LIGHT,
    searchQueries: ["fruity coffee", "light roast", "ethiopian", "floral coffee"],
    productPreferences: ["yirgacheffe", "kenya", "ethiopia", "light"],
  },
  BALANCED_DRINKER: {
    preferredRoast: RoastLevel.MEDIUM,
    searchQueries: ["medium roast", "breakfast blend", "smooth coffee", "colombia"],
    productPreferences: ["colombia", "guatemala", "medium", "breakfast"],
  },
  ADVENTUROUS_TASTER: {
    preferredRoast: null, // Tries everything
    searchQueries: ["rare coffee", "micro lot", "geisha", "unique coffee", "honey process"],
    productPreferences: ["geisha", "micro", "panama", "yemen", "anaerobic"],
  },
  SUBSCRIPTION_CUSTOMER: {
    preferredRoast: RoastLevel.MEDIUM,
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

async function main() {
  console.log("🌱 Starting synthetic user behavior seed...\n");

  // --- Fetch existing products ---
  type ProductWithVariants = Awaited<ReturnType<typeof prisma.product.findMany<{
    include: { variants: { include: { purchaseOptions: true } } }
  }>>>[number];
  
  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          purchaseOptions: true,
        },
      },
    },
  });

  if (products.length === 0) {
    throw new Error("No products found! Run the main seed script first.");
  }

  console.log(`✓ Found ${products.length} products\n`);

  // --- Create synthetic users with personas ---
  const userCount = 75;
  const users: any[] = [];

  for (let i = 0; i < userCount; i++) {
    const personaKeys = Object.keys(PERSONAS);
    const personaKey = randomElement(personaKeys);
    const persona = PERSONAS[personaKey as keyof typeof PERSONAS];

    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const user = await prisma.user.create({
      data: {
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        passwordHash: hashedPassword,
        emailVerified: new Date(),
      },
    });

    users.push({ ...user, persona, personaKey });
  }

  console.log(`✓ Created ${users.length} synthetic users\n`);

  // --- Generate user activities ---
  let totalActivities = 0;
  let totalOrders = 0;

  for (const user of users) {
    const sessionId = generateSessionId();
    const activityCount = randomInt(3, 15); // Each user generates 3-15 activities
    const daysActive = randomInt(1, 60); // Active within last 60 days

    // === PAGE VIEWS ===
    for (let i = 0; i < activityCount; i++) {
      await prisma.userActivity.create({
        data: {
          sessionId,
          userId: user.id,
          activityType: ActivityType.PAGE_VIEW,
          source: randomElement(["homepage", "category-page", "search-results"]),
          createdAt: daysAgo(randomInt(0, daysActive)),
        },
      });
      totalActivities++;
    }

    // === PRODUCT VIEWS ===
    const viewedProductCount = randomInt(2, 8);
    const viewedProducts: ProductWithVariants[] = [];

    for (let i = 0; i < viewedProductCount; i++) {
      // Bias towards persona preferences
      let product: ProductWithVariants;
      if (user.persona.preferredRoast) {
        const matchingProducts = products.filter(
          (p) => p.roastLevel === user.persona.preferredRoast
        );
        product = randomElement(matchingProducts.length > 0 ? matchingProducts : products);
      } else {
        product = randomElement(products);
      }

      viewedProducts.push(product);

      await prisma.userActivity.create({
        data: {
          sessionId,
          userId: user.id,
          activityType: ActivityType.PRODUCT_VIEW,
          productId: product.id,
          productSlug: product.slug,
          source: "product-page",
          createdAt: daysAgo(randomInt(0, daysActive)),
        },
      });
      totalActivities++;
    }

    // === SEARCH QUERIES ===
    const searchCount = randomInt(1, 4);
    for (let i = 0; i < searchCount; i++) {
      const query: string = randomElement(user.persona.searchQueries);
      await prisma.userActivity.create({
        data: {
          sessionId,
          userId: user.id,
          activityType: ActivityType.SEARCH,
          searchQuery: query,
          source: "homepage",
          createdAt: daysAgo(randomInt(0, daysActive)),
        },
      });
      totalActivities++;
    }

    // === ADD TO CART ===
    const cartCount = randomInt(1, 3);
    for (let i = 0; i < cartCount; i++) {
      const product = randomElement(viewedProducts.length > 0 ? viewedProducts : products);
      await prisma.userActivity.create({
        data: {
          sessionId,
          userId: user.id,
          activityType: ActivityType.ADD_TO_CART,
          productId: product.id,
          productSlug: product.slug,
          source: "product-page",
          createdAt: daysAgo(randomInt(0, daysActive)),
        },
      });
      totalActivities++;
    }

    // === ORDERS (30-40% of users make purchases) ===
    const shouldPurchase = Math.random() < 0.35;
    if (shouldPurchase) {
      const orderCount = randomInt(1, 3);
      
      for (let i = 0; i < orderCount; i++) {
        const product = randomElement(viewedProducts.length > 0 ? viewedProducts : products);
        const variant = randomElement(product.variants);
        const purchaseOption = randomElement(variant.purchaseOptions);

        await prisma.order.create({
          data: {
            userId: user.id,
            totalInCents: purchaseOption.priceInCents,
            status: "SHIPPED",
            deliveryMethod: "DELIVERY",
            customerEmail: user.email!,
            recipientName: user.name!,
            shippingStreet: "123 Main St",
            shippingCity: "Anytown",
            shippingState: "CA",
            shippingPostalCode: "90210",
            shippingCountry: "US",
            items: {
              create: {
                quantity: 1,
                priceInCents: purchaseOption.priceInCents,
                purchaseOptionId: purchaseOption.id,
              },
            },
            createdAt: daysAgo(randomInt(5, daysActive)),
          },
        });
        totalOrders++;
      }
    }
  }

  console.log(`✓ Generated ${totalActivities} user activities`);
  console.log(`✓ Generated ${totalOrders} orders`);

  // === ANONYMOUS USER ACTIVITIES ===
  console.log("\n🔄 Generating anonymous user activities...\n");

  const anonymousSessionCount = 30;
  let anonymousActivities = 0;

  for (let i = 0; i < anonymousSessionCount; i++) {
    const sessionId = generateSessionId();
    const activityCount = randomInt(1, 5);

    for (let j = 0; j < activityCount; j++) {
      const activityType = randomElement([
        ActivityType.PAGE_VIEW,
        ActivityType.PRODUCT_VIEW,
        ActivityType.SEARCH,
      ]);

      if (activityType === ActivityType.PRODUCT_VIEW) {
        const product = randomElement(products);
        await prisma.userActivity.create({
          data: {
            sessionId,
            userId: null, // Anonymous
            activityType,
            productId: product.id,
            productSlug: product.slug,
            source: "product-page",
            createdAt: daysAgo(randomInt(0, 7)),
          },
        });
      } else if (activityType === ActivityType.SEARCH) {
        const allQueries = Object.values(PERSONAS).flatMap((p) => p.searchQueries);
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

  console.log(`✓ Generated ${anonymousActivities} anonymous activities\n`);

  console.log("✅ Synthetic user behavior seed complete!\n");
  console.log("Summary:");
  console.log(`  - ${users.length} users created`);
  console.log(`  - ${totalActivities + anonymousActivities} total activities`);
  console.log(`  - ${totalOrders} orders placed`);
  console.log(`  - ${anonymousSessionCount} anonymous sessions\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
