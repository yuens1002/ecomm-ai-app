import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL =
  "https://api.stability.ai/v2beta/stable-image/generate/sd3";
const REFERENCE_IMAGE_PATH = path.join(process.cwd(), "public", "sample.webp");
const OUTPUT_DIR = path.join(process.cwd(), "public", "products");

if (!STABILITY_API_KEY) {
  throw new Error("STABILITY_API_KEY not found in environment variables");
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateImage(
  productName: string,
  productSlug: string
): Promise<string> {
  console.log(`\nGenerating image for: ${productName}`);

  // Load and resize reference image to 1024x1024 for SDXL
  const referenceBuffer = await sharp(REFERENCE_IMAGE_PATH)
    .resize(1024, 1024, { fit: "fill" })
    .toBuffer();

  const prompt = `Coffee bag with '${productName}' label, exact same style and composition as reference image`;

  console.log(`Prompt: ${prompt}`);

  const formData = new FormData();
  formData.append("image", referenceBuffer, {
    filename: "reference.webp",
    contentType: "image/webp",
  });
  formData.append("prompt", prompt);
  formData.append("mode", "image-to-image");
  formData.append("output_format", "webp");
  formData.append("model", "sd3.5-large");
  formData.append("strength", "0.35");
  formData.append("cfg_scale", "7");
  formData.append("steps", "30");

  const response = await fetch(STABILITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: "image/*",
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Stability AI API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const imageBuffer = await response.buffer();

  // Save the full 1024x1024 image (no cropping)
  const outputPath = path.join(OUTPUT_DIR, `${productSlug}.webp`);
  await sharp(imageBuffer).webp().toFile(outputPath);

  console.log(`✓ Saved: ${outputPath}`);

  return `/products/${productSlug}.webp`;
}

async function updateProductImage(productId: string, imageUrl: string) {
  // Find existing image record
  const existingImage = await prisma.productImage.findFirst({
    where: { productId },
  });

  if (existingImage) {
    // Update existing image
    await prisma.productImage.update({
      where: { id: existingImage.id },
      data: { url: imageUrl },
    });
    console.log(`✓ Updated image URL in database for product ${productId}`);
  } else {
    // Create new image record
    await prisma.productImage.create({
      data: {
        productId,
        url: imageUrl,
        alt: "Product image",
      },
    });
    console.log(
      `✓ Created new image record in database for product ${productId}`
    );
  }
}

async function main() {
  try {
    console.log("Fetching all products from database...");
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`Found ${products.length} products to process\n`);
    console.log("Starting batch image generation...");
    console.log(
      "This will use approximately",
      (products.length * 0.2).toFixed(1),
      "credits\n"
    );

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(
        `\n[${i + 1}/${products.length}] Processing: ${product.name}`
      );

      try {
        const imageUrl = await generateImage(product.name, product.slug);
        await updateProductImage(product.id, imageUrl);
        successCount++;

        // Small delay to avoid rate limiting
        if (i < products.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`✗ Error processing ${product.name}:`, error);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("BATCH GENERATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${errorCount}`);
    console.log(`Total processed: ${products.length}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
