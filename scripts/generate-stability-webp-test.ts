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
const REFERENCE_IMAGE_PATH = path.join(
  process.cwd(),
  "public",
  "reference-image.png"
);
const OUTPUT_DIR = path.join(process.cwd(), "public", "products");

if (!STABILITY_API_KEY) {
  throw new Error("STABILITY_API_KEY not found in environment variables");
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateTestImage() {
  console.log("\n🎨 Testing WebP image generation with Stability AI...\n");

  // Get first product for testing
  const product = await prisma.product.findFirst();
  if (!product) {
    throw new Error("No products found in database");
  }

  console.log(`Testing with: ${product.name}`);

  // Load and resize reference image to 1024x1024 for SDXL
  const referenceBuffer = await sharp(REFERENCE_IMAGE_PATH)
    .resize(1024, 1024, { fit: "fill" })
    .toBuffer();

  const prompt = `Coffee package, exact same style and layout as reference. Replace all text: put "ARTISAN ROAST" brand name in center, put "${product.name.toUpperCase()}" in upper left orange label area. Keep same colors, geometric pattern, and minimalist design.`;

  console.log(`Prompt: ${prompt}`);
  console.log("Calling Stability AI API...\n");

  const formData = new FormData();
  formData.append("image", referenceBuffer, {
    filename: "reference.webp",
    contentType: "image/webp",
  });
  formData.append("prompt", prompt);
  formData.append("mode", "image-to-image");
  formData.append("output_format", "webp");
  formData.append("model", "sd3.5-large");
  formData.append("strength", "0.45");
  formData.append("cfg_scale", "8");
  formData.append("steps", "35");

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

  // Save as WebP
  const outputPath = path.join(OUTPUT_DIR, "stability-test.webp");
  await sharp(imageBuffer).webp().toFile(outputPath);

  console.log(`✅ Test image saved: ${outputPath}`);
  console.log(`💰 Used approximately 0.2 credits\n`);
}

async function main() {
  try {
    await generateTestImage();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
