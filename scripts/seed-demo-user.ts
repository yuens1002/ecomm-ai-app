import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, ActivityType, RoastLevel, PurchaseType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function generateSessionId(): string {
  return `sess_demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

async function main() {
  console.log("👤 Creating demo user with rich behavioral history...\n");

  type ProductWithVariants = Awaited<ReturnType<typeof prisma.product.findMany<{
    include: { variants: { include: { purchaseOptions: true } } }
  }>>>[number];

  // Fetch all products
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

  // Delete existing demo user if exists (cascade deletes orders, activities, etc.)
  const existingUser = await prisma.user.findUnique({
    where: { email: "demo@artisanroast.com" },
  });

  if (existingUser) {
    // Delete related records first
    await prisma.subscription.deleteMany({ where: { userId: existingUser.id } });
    await prisma.orderItem.deleteMany({
      where: { order: { userId: existingUser.id } },
    });
    await prisma.order.deleteMany({ where: { userId: existingUser.id } });
    await prisma.userActivity.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
    console.log("  ✓ Deleted existing demo user\n");
  }

  // Create demo user
  const hashedPassword = await bcrypt.hash("Demo123!", 10);
  const demoUser = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@artisanroast.com",
      passwordHash: hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log(`✓ Created demo user: ${demoUser.email}\n`);

  // Define demo user preferences (adventurous taster profile)
  const favoriteProducts = products.filter(
    (p) =>
      p.name.includes("Geisha") ||
      p.name.includes("Yirgacheffe") ||
      p.name.includes("Kenya") ||
      p.name.includes("Espresso")
  );

  const sessionId = generateSessionId();
  let activityCount = 0;

  // === 1. PAST ORDERS (10 orders over 90 days) ===
  console.log("📦 Creating order history...");
  const orderProducts: ProductWithVariants[] = [
    products.find((p) => p.name.includes("Ethiopia"))!,
    products.find((p) => p.name.includes("Kenya"))!,
    products.find((p) => p.name.includes("Panama Geisha"))!,
    products.find((p) => p.name.includes("Colombia Geisha"))!,
    products.find((p) => p.name.includes("Midnight Espresso"))!,
    products.find((p) => p.name.includes("Breakfast Blend"))!,
    products.find((p) => p.name.includes("Guatemala"))!,
    products.find((p) => p.name.includes("Yemen"))!,
    products.find((p) => p.name.includes("Rwanda"))!,
    products.find((p) => p.name.includes("Costa Rica Honey"))!,
  ].filter(Boolean);

  for (let i = 0; i < orderProducts.length; i++) {
    const product = orderProducts[i];
    const variant = product.variants[0];
    const purchaseOption = variant.purchaseOptions[0];

    await prisma.order.create({
      data: {
        userId: demoUser.id,
        totalInCents: purchaseOption.priceInCents,
        status: i < 8 ? "SHIPPED" : "PENDING",
        deliveryMethod: "DELIVERY",
        customerEmail: demoUser.email!,
        recipientName: demoUser.name!,
        shippingStreet: "456 Coffee Lane",
        shippingCity: "Portland",
        shippingState: "OR",
        shippingPostalCode: "97201",
        shippingCountry: "US",
        items: {
          create: {
            quantity: 1,
            priceInCents: purchaseOption.priceInCents,
            purchaseOptionId: purchaseOption.id,
          },
        },
        createdAt: daysAgo(90 - i * 9),
      },
    });
  }

  console.log(`  ✓ Created ${orderProducts.length} past orders\n`);

  // === 2. ACTIVE SUBSCRIPTION ===
  console.log("🔄 Creating active subscription...");
  const subscriptionProduct = products.find((p) => p.name.includes("Ethiopian Yirgacheffe"));
  if (subscriptionProduct) {
    const variant = subscriptionProduct.variants[0];
    const subscriptionOption = variant.purchaseOptions.find(
      (po) => po.type === PurchaseType.SUBSCRIPTION
    );

    if (subscriptionOption) {
      await prisma.subscription.create({
        data: {
          userId: demoUser.id,
          stripeSubscriptionId: `sub_demo_${Date.now()}`,
          stripeCustomerId: `cus_demo_${Date.now()}`,
          status: "ACTIVE",
          productNames: [`${subscriptionProduct.name} - ${variant.name}`],
          stripeProductIds: [`prod_demo_${Date.now()}`],
          stripePriceIds: [`price_demo_${Date.now()}`],
          productDescription: subscriptionProduct.description,
          quantities: [1],
          priceInCents: subscriptionOption.priceInCents,
          deliverySchedule: "Monthly",
          currentPeriodStart: daysAgo(15),
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        },
      });
      console.log(`  ✓ Created active subscription for ${subscriptionProduct.name}\n`);
    }
  }

  // === 3. PRODUCT VIEWS (60+ views) ===
  console.log("👀 Generating product view history...");
  const viewCount = 65;
  const recentlyViewed: ProductWithVariants[] = [];

  for (let i = 0; i < viewCount; i++) {
    let product: ProductWithVariants;

    // 60% chance to view favorite products, 40% random exploration
    if (Math.random() < 0.6 && favoriteProducts.length > 0) {
      product = randomElement(favoriteProducts);
    } else {
      product = randomElement(products);
    }

    recentlyViewed.push(product);

    await prisma.userActivity.create({
      data: {
        sessionId,
        userId: demoUser.id,
        activityType: ActivityType.PRODUCT_VIEW,
        productId: product.id,
        productSlug: product.slug,
        source: "product-page",
        createdAt: daysAgo(randomInt(0, 45)),
      },
    });
    activityCount++;
  }

  console.log(`  ✓ Generated ${viewCount} product views\n`);

  // === 4. SEARCH QUERIES (25 searches) ===
  console.log("🔍 Generating search history...");
  const searchQueries = [
    "ethiopian coffee",
    "light roast fruity",
    "geisha coffee",
    "micro lot",
    "floral coffee",
    "kenya aa",
    "natural process",
    "honey process coffee",
    "best light roast",
    "specialty coffee",
    "single origin",
    "panama geisha",
    "yirgacheffe",
    "rare coffee beans",
    "complex flavors",
    "berry notes",
    "citrus coffee",
    "bright acidity",
    "ethiopian natural",
    "kenya peaberry",
    "colombia geisha",
    "subscription coffee",
    "best espresso beans",
    "dark roast",
    "organic coffee",
  ];

  for (const query of searchQueries) {
    await prisma.userActivity.create({
      data: {
        sessionId,
        userId: demoUser.id,
        activityType: ActivityType.SEARCH,
        searchQuery: query,
        source: "homepage",
        createdAt: daysAgo(randomInt(0, 60)),
      },
    });
    activityCount++;
  }

  console.log(`  ✓ Generated ${searchQueries.length} search queries\n`);

  // === 5. PAGE VIEWS (40 general page views) ===
  console.log("📄 Generating page view history...");
  for (let i = 0; i < 40; i++) {
    await prisma.userActivity.create({
      data: {
        sessionId,
        userId: demoUser.id,
        activityType: ActivityType.PAGE_VIEW,
        source: randomElement(["homepage", "category-page", "search-results", "account-page"]),
        createdAt: daysAgo(randomInt(0, 45)),
      },
    });
    activityCount++;
  }

  console.log(`  ✓ Generated 40 page views\n`);

  // === 6. ADD TO CART (items currently in cart) ===
  console.log("🛒 Adding items to cart...");
  const cartProducts = [
    products.find((p) => p.name.includes("Burundi"))!,
    products.find((p) => p.name.includes("Tanzania"))!,
    products.find((p) => p.name.includes("Hawaiian Kona"))!,
  ].filter(Boolean);

  for (const product of cartProducts) {
    await prisma.userActivity.create({
      data: {
        sessionId,
        userId: demoUser.id,
        activityType: ActivityType.ADD_TO_CART,
        productId: product.id,
        productSlug: product.slug,
        source: "product-page",
        createdAt: daysAgo(randomInt(0, 3)), // Recent cart additions
      },
    });
    activityCount++;
  }

  console.log(`  ✓ Added ${cartProducts.length} items to cart\n`);

  // === SUMMARY ===
  console.log("✅ Demo user setup complete!\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("📊 Demo User Stats:");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Email:        demo@artisanroast.com`);
  console.log(`  Password:     Demo123!`);
  console.log(`  Orders:       ${orderProducts.length} (8 shipped, 2 pending)`);
  console.log(`  Subscription: 1 active (Ethiopian Yirgacheffe)`);
  console.log(`  Activities:   ${activityCount} total`);
  console.log(`    - Product views: ${viewCount}`);
  console.log(`    - Searches:      ${searchQueries.length}`);
  console.log(`    - Page views:    40`);
  console.log(`    - Cart items:    ${cartProducts.length}`);
  console.log(`  Profile:      Adventurous light roast enthusiast`);
  console.log("═══════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
