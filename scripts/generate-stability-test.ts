/**
 * Test image generation with Stability AI using reference image
 * Uses Stable Diffusion 3.0 with image-to-image
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import sharp from "sharp";

config({ path: ".env.local" });

const prisma = new PrismaClient();
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

async function main() {
  console.log("🎨 Testing Stability AI image generation...\n");

  if (!STABILITY_API_KEY) {
    console.error("❌ STABILITY_API_KEY not found in .env.local");
    console.log(
      "💡 Get your key from: https://platform.stability.ai/account/keys"
    );
    console.log("💡 You get 25 FREE credits to start!");
    return;
  }

  // Get first product
  const product = await prisma.product.findFirst();
  if (!product) {
    console.log("No products found");
    return;
  }

  console.log(`Testing with: ${product.name}\n`);

  // Read reference image
  const referenceImagePath = path.join(process.cwd(), "public", "sample.webp");

  try {
    const originalImage = await fs.readFile(referenceImagePath);

    // Resize image to 1024x1024 (required by SDXL)
    const imageBuffer = await sharp(originalImage)
      .resize(1024, 1024, { fit: "cover" })
      .png()
      .toBuffer();

    console.log("✅ Reference image loaded and resized to 1024x1024\n");

    // Prepare the prompt - keep it simple, match the reference
    const prompt = `Coffee bag with "${product.name.toUpperCase()}" label, exact same style and composition as reference image`;

    console.log(`📝 Prompt: ${prompt}\n`);
    console.log("🔄 Sending request to Stability AI...\n");

    // Convert image to base64
    const base64Image = imageBuffer.toString("base64");

    // Call Stability AI API with multipart/form-data
    const formData = new FormData();
    formData.append("init_image", imageBuffer, {
      filename: "reference.png",
      contentType: "image/png",
    });
    formData.append("init_image_mode", "IMAGE_STRENGTH");
    formData.append("image_strength", "0.35");
    formData.append("text_prompts[0][text]", prompt);
    formData.append("text_prompts[0][weight]", "1");
    formData.append("cfg_scale", "7");
    formData.append("samples", "1");
    formData.append("steps", "30");

    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: "application/json",
          ...formData.getHeaders(),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Stability AI error:", error);
      return;
    }

    const result = await response.json();

    if (!result.artifacts || result.artifacts.length === 0) {
      console.error("❌ No image generated");
      return;
    }

    console.log("✅ Image generated!");
    console.log(`⬇️  Saving (no cropping)...\n`);

    // Save image (it comes as base64) - keep as 1024x1024, no cropping
    const imageData = result.artifacts[0].base64;
    const buffer = Buffer.from(imageData, "base64");

    const publicDir = path.join(process.cwd(), "public", "products");
    await fs.mkdir(publicDir, { recursive: true });

    const filename = "stability-test.png";
    const filepath = path.join(publicDir, filename);
    await fs.writeFile(filepath, buffer);

    console.log(`✅ Test image saved: public/products/${filename}`);
    console.log(`\n💡 Open the image to see if it matches your style!`);
    console.log(
      `💰 This used approximately 0.2 credits (you have 25 free to start)`
    );
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.error("❌ Reference image not found!");
      console.log(
        "💡 Save your reference image as: public/reference-image.png"
      );
    } else {
      console.error("❌ Error:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
