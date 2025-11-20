import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating all product image URLs to use .png format...\n");

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  console.log(`Found ${products.length} products to update\n`);

  for (const product of products) {
    const newImageUrl = `/products/${product.slug}.png`;

    // Check if image record exists
    const existingImage = await prisma.productImage.findFirst({
      where: { productId: product.id },
    });

    if (existingImage) {
      // Update existing image
      await prisma.productImage.update({
        where: { id: existingImage.id },
        data: { url: newImageUrl },
      });
      console.log(`✓ Updated: ${product.name} -> ${newImageUrl}`);
    } else {
      // Create new image record
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: newImageUrl,
          alt: `${product.name} coffee bag`,
          order: 1,
        },
      });
      console.log(`✓ Created: ${product.name} -> ${newImageUrl}`);
    }
  }

  console.log("\n✅ All product image URLs updated successfully!");
}

main()
  .catch((error) => {
    console.error("Error updating image URLs:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
