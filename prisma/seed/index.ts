import { config } from "dotenv";
config({ path: ".env.local" });

import {
  PrismaClient,
  PurchaseType,
  BillingInterval,
  RoastLevel,
} from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// Import seed modules
import { seedSettings } from "./settings";
import { seedCategories } from "./categories";
import { seedProducts } from "./products";
import { seedUsers } from "./users";
import { seedCmsPages } from "./cms-pages";
import { seedSyntheticData } from "./synthetic-data";

async function main() {
  console.log("🌱 Starting modular database seeding...\n");

  try {
    // Phase 1: Foundation data
    console.log("📋 Phase 1: Seeding foundation data...");
    await seedSettings(prisma);
    await seedCategories(prisma);

    // Phase 2: Core business data
    console.log("\n🛒 Phase 2: Seeding products...");
    await seedProducts(prisma);

    // Phase 3: User data
    console.log("\n👥 Phase 3: Seeding users...");
    await seedUsers(prisma);

    // Phase 4: CMS content
    console.log("\n📄 Phase 4: Seeding CMS pages...");
    await seedCmsPages(prisma);

    // Phase 5: Synthetic behavior data
    console.log("\n🎭 Phase 5: Seeding synthetic user behavior...");
    await seedSyntheticData(prisma);

    console.log("\n✅ All seeding completed successfully!");
    console.log("🎉 Database is ready for development!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Fatal seeding error:", e);
  process.exit(1);
});
