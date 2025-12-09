/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { config } from "dotenv";
// Force node-api engine before Prisma client module loads (overrides any env setting client/edge).
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
process.env.PRISMA_GENERATE_ENGINE_TYPE = "library";
config({ path: ".env.local" });
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
process.env.PRISMA_GENERATE_ENGINE_TYPE = "library";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { Pool } from "pg";

// Load PrismaClient after engine env is set to ensure node-api is used.
const { PrismaClient } = require("@prisma/client");

const shouldUseNeonAdapter = () => {
  const adapterEnv = process.env.DATABASE_ADAPTER?.toLowerCase();
  if (adapterEnv === "neon") return true;
  if (adapterEnv === "postgres" || adapterEnv === "standard") return false;
  return process.env.DATABASE_URL?.includes("neon.tech") ?? false;
};

const shouldSeedSyntheticData = () => {
  const raw = (process.env.SEED_INCLUDE_SYNTHETIC ?? "true").toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "no";
};

const shouldSeedUsers = () => {
  const raw = (process.env.SEED_INCLUDE_USERS ?? "true").toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "no";
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run modular seeds");
  }

  if (!shouldUseNeonAdapter()) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  neonConfig.webSocketConstructor = ws;
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
};

const prisma = createPrismaClient();

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
    if (shouldSeedUsers()) {
      console.log("\n👥 Phase 3: Seeding users...");
      await seedUsers(prisma);
    } else {
      console.log(
        "\n↷ Phase 3 skipped: SEED_INCLUDE_USERS is false (clean install, owner will create first admin)"
      );
    }

    // Phase 4: CMS content
    console.log("\n📄 Phase 4: Seeding CMS pages...");
    await seedCmsPages(prisma);

    // Phase 5: Synthetic behavior data (optional for clean installs)
    if (shouldSeedSyntheticData()) {
      console.log("\n🎭 Phase 5: Seeding synthetic user behavior...");
      await seedSyntheticData(prisma);
    } else {
      console.log(
        "\n↷ Phase 5 skipped: SEED_INCLUDE_SYNTHETIC is false (clean install mode)"
      );
    }

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
