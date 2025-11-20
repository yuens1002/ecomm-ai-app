/**
 * Generate Product Images using Grok AI
 *
 * This script:
 * 1. Fetches all products from the database
 * 2. Generates professional product photography prompts
 * 3. Calls Grok API to generate images
 * 4. Downloads and saves images to public/products/
 * 5. Updates database with new image URLs
 *
 * Usage: npx tsx scripts/generate-product-images.ts
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

// Load environment variables from .env.local
config({ path: ".env.local" });

const prisma = new PrismaClient();

// Grok API configuration
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = "https://api.x.ai/v1/images/generations";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  roastLevel: string;
  origin: string[];
  tastingNotes: string[];
}

/**
 * Generate a detailed prompt for product image generation
 */
function generateImagePrompt(product: Product): string {
  return `Professional product photography of a coffee package. Minimalist design with clean white/light gray background. The package is a white flat rectangular box shown straight on slightly from below. The coffee should be branded "artisan roast" with a bright color rectangular box denoting "${product.name.toUpperCase()}" at the upper left corner. Show the entire package, no cropping.`;
}

/**
 * Call Grok API to generate an image
 */
async function generateImage(
  prompt: string,
  productSlug: string
): Promise<string | null> {
  if (!GROK_API_KEY) {
    throw new Error("GROK_API_KEY environment variable is not set");
  }

  try {
    console.log(`🎨 Generating image for: ${productSlug}`);

    const response = await fetch(GROK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-2-image-1212", // Use latest image generation model
        prompt: prompt,
        n: 1, // Generate 1 image
        response_format: "url", // Get URL instead of base64
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Grok API error for ${productSlug}:`, errorData);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      console.error(`❌ No image URL returned for ${productSlug}`);
      return null;
    }

    console.log(`✅ Image generated for: ${productSlug}`);
    return imageUrl;
  } catch (error) {
    console.error(`❌ Error generating image for ${productSlug}:`, error);
    return null;
  }
}

/**
 * Download image from URL and save locally
 */
async function downloadImage(
  imageUrl: string,
  productSlug: string
): Promise<string | null> {
  try {
    console.log(`⬇️  Downloading image for: ${productSlug}`);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`❌ Failed to download image for ${productSlug}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to public/products/
    const publicDir = path.join(process.cwd(), "public", "products");
    await fs.mkdir(publicDir, { recursive: true });

    const filename = `${productSlug}.webp`; // Use WEBP for better compression
    const filepath = path.join(publicDir, filename);

    await fs.writeFile(filepath, buffer);
    console.log(`✅ Image saved: ${filename}`);

    return `/products/${filename}`;
  } catch (error) {
    console.error(`❌ Error downloading image for ${productSlug}:`, error);
    return null;
  }
}

/**
 * Update product image in database
 */
async function updateProductImage(
  productId: string,
  imageUrl: string
): Promise<void> {
  try {
    // Check if product already has images
    const existingImages = await prisma.productImage.findMany({
      where: { productId },
    });

    if (existingImages.length > 0) {
      // Update the first image
      await prisma.productImage.update({
        where: { id: existingImages[0].id },
        data: {
          url: imageUrl,
          altText: `${existingImages[0].altText} - AI Generated`,
        },
      });
      console.log(`✅ Updated existing image for product ${productId}`);
    } else {
      // Create new image
      await prisma.productImage.create({
        data: {
          productId,
          url: imageUrl,
          altText: "AI Generated Product Image",
          order: 0,
        },
      });
      console.log(`✅ Created new image for product ${productId}`);
    }
  } catch (error) {
    console.error(
      `❌ Error updating database for product ${productId}:`,
      error
    );
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting product image generation...\n");

  // Check for API key
  if (!GROK_API_KEY) {
    console.error("❌ GROK_API_KEY environment variable is required");
    console.log("💡 Get your API key from: https://x.ai/api");
    process.exit(1);
  }

  try {
    // Fetch all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        roastLevel: true,
        origin: true,
        tastingNotes: true,
      },
    });

    console.log(`📦 Found ${products.length} products\n`);

    if (products.length === 0) {
      console.log("⚠️  No products found in database. Run seed script first.");
      return;
    }

    // Process each product
    let successCount = 0;
    let failureCount = 0;

    for (const product of products) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Processing: ${product.name}`);
      console.log(`${"=".repeat(60)}\n`);

      // Generate prompt
      const prompt = generateImagePrompt(product);
      console.log(`📝 Prompt: ${prompt}\n`);

      // Generate image with Grok
      const imageUrl = await generateImage(prompt, product.slug);
      if (!imageUrl) {
        failureCount++;
        continue;
      }

      // Download image locally
      const localPath = await downloadImage(imageUrl, product.slug);
      if (!localPath) {
        failureCount++;
        continue;
      }

      // Update database
      await updateProductImage(product.id, localPath);
      successCount++;

      // Add delay to avoid rate limiting (adjust as needed)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✨ Image Generation Complete!`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Success: ${successCount}/${products.length}`);
    console.log(`❌ Failures: ${failureCount}/${products.length}`);
    console.log(`\n💡 Images saved to: public/products/`);
    console.log(`💡 Database updated with new image URLs`);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
