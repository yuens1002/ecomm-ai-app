/**
 * Generate a single test product image
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

config({ path: ".env.local" });

const prisma = new PrismaClient();
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = "https://api.x.ai/v1/images/generations";

async function main() {
  console.log("🎨 Generating test image...\n");

  // Get first product
  const product = await prisma.product.findFirst();

  if (!product) {
    console.log("No products found");
    return;
  }

  console.log(`Testing with: ${product.name}\n`);

  const colorPairs = [
    { bag: "burgundy/deep red", bg: "warm peachy-pink" },
    { bag: "deep forest green", bg: "soft sage green" },
    { bag: "rich terracotta", bg: "pale cream" },
    { bag: "deep purple", bg: "muted lavender" },
    { bag: "golden mustard", bg: "warm butter yellow" },
    { bag: "dusty mauve", bg: "dusty rose" },
  ];

  const colorPair = colorPairs[0]; // Use first color pair for test

  const prompt = `Product photography of coffee bag on wooden table, colorful geometric triangle pattern covering entire ${colorPair.bag} bag in vibrant pink magenta blue yellow gold colors, large cream colored rounded rectangle label in center with "ARTISAN ROAST" text in white on pink banner and "${product.name.toUpperCase()}" text in black on cream label, small black rectangle label at top, standing upright paper bag with flat bottom, soft pink peachy background wall, coffee beans scattered on left side, monstera plant leaf visible on left edge, natural window light, commercial product photography, professional studio quality`;

  console.log(`📝 Prompt:\n${prompt}\n`);

  // Generate image
  const response = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-2-image-1212",
      prompt: prompt,
      n: 1,
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`❌ Error:`, errorData);
    return;
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    console.error("❌ No image URL returned");
    return;
  }

  console.log(`✅ Image generated!`);
  console.log(`⬇️  Downloading...\n`);

  // Download image
  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const publicDir = path.join(process.cwd(), "public", "products");
  await fs.mkdir(publicDir, { recursive: true });

  const filename = "test-image.webp";
  const filepath = path.join(publicDir, filename);
  await fs.writeFile(filepath, buffer);

  console.log(`✅ Test image saved: public/products/${filename}`);
  console.log(`\n💡 Open the image to review the style!`);

  await prisma.$disconnect();
}

main();
