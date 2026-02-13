import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { Pool } from "pg";

const shouldUseNeonAdapter = () => {
  const adapterEnv = process.env.DATABASE_ADAPTER?.toLowerCase();
  if (adapterEnv === "neon") return true;
  if (adapterEnv === "postgres" || adapterEnv === "standard") return false;
  return process.env.DATABASE_URL?.includes("neon.tech") ?? false;
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for CRUD smoke test");
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

async function run() {
  console.log("🔎 Starting CRUD smoke test...");

  // Create a unique suffix to avoid collisions
  const suffix = Date.now().toString(36);

  // Create
  const product = await prisma.product.create({
    data: {
      name: `Smoke Test Coffee ${suffix}`,
      slug: `smoke-test-${suffix}`,
      description: "Temporary smoke-test product",
      tastingNotes: ["smoke", "test"],
      origin: ["Testland"],
      roastLevel: "MEDIUM",
      variants: {
        create: {
          name: "12oz Bag",
          weight: 340,
          stockQuantity: 10,
          purchaseOptions: {
            create: {
              type: "ONE_TIME",
              priceInCents: 1900,
            },
          },
        },
      },
    },
    include: {
      variants: { include: { purchaseOptions: true } },
    },
  });
  console.log(`✅ Created product ${product.slug}`);

  // Read
  const fetched = await prisma.product.findUnique({
    where: { slug: product.slug },
    include: { variants: { include: { purchaseOptions: true } } },
  });
  if (!fetched) throw new Error("Failed to read product");
  console.log("✅ Read product and variants");

  // Update
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { description: "Updated description (smoke test)" },
  });
  console.log(`✅ Updated product ${updated.slug}`);

  // Delete
  await prisma.product.delete({ where: { id: product.id } });
  console.log("✅ Deleted product");

  console.log("🎉 CRUD smoke test finished");
}

run()
  .catch((error) => {
    console.error("❌ CRUD smoke test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
