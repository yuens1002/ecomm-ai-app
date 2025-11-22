
import os

# Read the generated data
with open('seed_data.txt', 'r', encoding='utf-8') as f:
    coffee_data = f.read()

# Construct the full file content
content = """import { config } from "dotenv";
config({ path: ".env.local" });

import {
  PrismaClient,
  PurchaseType,
  BillingInterval,
} from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Start seeding with 30 specialty coffee products...`);

  // --- 1. Create Categories ---
  const catBlends = await prisma.category.upsert({
    where: { slug: "blends" },
    update: {},
    create: { name: "Blends", slug: "blends" },
  });

  const catSingleOrigin = await prisma.category.upsert({
    where: { slug: "single-origin" },
    update: {},
    create: { name: "Single Origin", slug: "single-origin" },
  });

  const catMicroLot = await prisma.category.upsert({
    where: { slug: "micro-lot" },
    update: {},
    create: { name: "Micro Lot", slug: "micro-lot" },
  });

  const catDark = await prisma.category.upsert({
    where: { slug: "dark-roast" },
    update: {},
    create: { name: "Dark Roast", slug: "dark-roast", label: "Roast Level" },
  });

  const catMedium = await prisma.category.upsert({
    where: { slug: "medium-roast" },
    update: {},
    create: { name: "Medium Roast", slug: "medium-roast", label: "Roast Level" },
  });

  const catLight = await prisma.category.upsert({
    where: { slug: "light-roast" },
    update: {},
    create: { name: "Light Roast", slug: "light-roast", label: "Roast Level" },
  });

  console.log("Categories created/verified.");

  // --- 2. Define 30 Products ---
""" + coffee_data + """

  // --- 3. Loop and upsert products ---
  for (const item of coffeeData) {
    const { product: productData, categories: categoryLinks } = item;

    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        name: productData.name,
        description: productData.description,
        origin: productData.origin,
        tastingNotes: productData.tastingNotes,
        isOrganic: productData.isOrganic,
        // roastLevel removed
        isFeatured: productData.isFeatured,
        featuredOrder: productData.featuredOrder,
        // We do not update images/variants here to avoid breaking FK constraints with Orders
      },
      create: productData,
    });

    await prisma.categoriesOnProducts.deleteMany({
      where: { productId: product.id },
    });

    await prisma.categoriesOnProducts.createMany({
      data: categoryLinks.map((link) => ({
        productId: product.id,
        categoryId: link.categoryId,
        isPrimary: link.isPrimary,
      })),
    });

    console.log(`✓ ${product.name}`);
  }

  console.log(`\\n✅ Seeding finished: 30 specialty coffee products created!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
"""

with open('prisma/seed.ts', 'w', encoding='utf-8') as f:
    f.write(content)
