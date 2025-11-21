import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting category migration...");

  // 1. Migrate Origins
  console.log("\n--- Migrating Origins ---");
  const products = await prisma.product.findMany({
    select: { id: true, name: true, origin: true },
  });

  const uniqueOrigins = new Set<string>();
  products.forEach((p) => p.origin.forEach((o) => uniqueOrigins.add(o)));

  for (const originName of uniqueOrigins) {
    // Skip "Blend" or "Micro Lot" as origins, we handle them separately or they are not real origins
    if (
      originName === "Blend" ||
      originName === "Blends" ||
      originName === "Micro Lot"
    )
      continue;

    const slug = originName.toLowerCase().replace(/\s+/g, "-");

    console.log(`Processing Origin: ${originName} (${slug})`);

    // Create or update the category
    const category = await prisma.category.upsert({
      where: { slug },
      update: { label: "Origins" },
      create: {
        name: originName,
        slug,
        label: "Origins",
      },
    });

    // Find products with this origin
    const productsInOrigin = products.filter((p) =>
      p.origin.includes(originName)
    );

    // Link products
    for (const product of productsInOrigin) {
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
    console.log(
      `  Linked ${productsInOrigin.length} products to ${originName}`
    );
  }

  // 2. Migrate Micro Lots
  console.log("\n--- Migrating Micro Lots ---");
  const microLotCategory = await prisma.category.upsert({
    where: { slug: "micro-lot" },
    update: { label: "Collections" },
    create: {
      name: "Micro Lot",
      slug: "micro-lot",
      label: "Collections",
    },
  });

  // Fetch full product details for text search
  const allProductsFull = await prisma.product.findMany();

  const microLotProducts = allProductsFull.filter((p) => {
    const lowerName = p.name.toLowerCase();
    const lowerDesc = p.description?.toLowerCase() || "";
    return (
      lowerName.includes("micro lot") ||
      lowerName.includes("microlot") ||
      lowerDesc.includes("micro lot") ||
      lowerDesc.includes("microlot") ||
      p.origin.includes("Micro Lot") ||
      lowerName.includes("geisha") ||
      lowerName.includes("kona") ||
      lowerName.includes("peaberry") ||
      lowerName.includes("yemen mocha")
    );
  });

  for (const product of microLotProducts) {
    await prisma.categoriesOnProducts.upsert({
      where: {
        productId_categoryId: {
          productId: product.id,
          categoryId: microLotCategory.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: microLotCategory.id,
      },
    });
  }
  console.log(`  Linked ${microLotProducts.length} products to Micro Lot`);

  // 3. Migrate Blends
  console.log("\n--- Migrating Blends ---");
  const blendsCategory = await prisma.category.upsert({
    where: { slug: "blends" },
    update: { label: "Collections" },
    create: {
      name: "Blends",
      slug: "blends",
      label: "Collections",
    },
  });

  const blendProducts = allProductsFull.filter((p) => {
    const lowerName = p.name.toLowerCase();
    return (
      p.origin.includes("Blend") ||
      p.origin.includes("Blends") ||
      lowerName.includes("blend")
    );
  });

  for (const product of blendProducts) {
    await prisma.categoriesOnProducts.upsert({
      where: {
        productId_categoryId: {
          productId: product.id,
          categoryId: blendsCategory.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: blendsCategory.id,
      },
    });
  }
  console.log(`  Linked ${blendProducts.length} products to Blends`);

  console.log("\nMigration complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
