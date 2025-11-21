import { prisma } from "../lib/prisma";
import { RoastLevel } from "@prisma/client";

async function main() {
  console.log("Starting roast level migration...");

  const roasts = [
    { level: RoastLevel.LIGHT, name: "Light Roast", slug: "light-roast" },
    { level: RoastLevel.MEDIUM, name: "Medium Roast", slug: "medium-roast" },
    { level: RoastLevel.DARK, name: "Dark Roast", slug: "dark-roast" },
  ];

  for (const roast of roasts) {
    console.log(`Processing Roast: ${roast.name} (${roast.slug})`);

    // 1. Create or update the category
    const category = await prisma.category.upsert({
      where: { slug: roast.slug },
      update: { label: "Roast Level" },
      create: {
        name: roast.name,
        slug: roast.slug,
        label: "Roast Level",
      },
    });

    // 2. Find products with this roast level
    const products = await prisma.product.findMany({
      where: {
        roastLevel: roast.level,
      },
    });

    // 3. Link products
    for (const product of products) {
      await prisma.categoriesOnProducts.upsert({
        where: {
          productId_categoryId: {
            productId: product.id,
            categoryId: category.id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          categoryId: category.id,
        },
      });
    }
    console.log(`  Linked ${products.length} products to ${roast.name}`);
  }

  console.log("\nRoast migration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
