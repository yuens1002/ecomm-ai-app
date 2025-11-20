/**
 * Test image generation with Replicate using reference image
 * Uses Stable Diffusion XL with img2img for consistent branding
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

config({ path: ".env.local" });

const prisma = new PrismaClient();
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

async function main() {
  console.log("🎨 Testing Replicate image generation...\n");

  if (!REPLICATE_API_KEY) {
    console.error("❌ REPLICATE_API_KEY not found in .env.local");
    console.log(
      "💡 Get your key from: https://replicate.com/account/api-tokens"
    );
    return;
  }

  // Get first product
  const product = await prisma.product.findFirst();
  if (!product) {
    console.log("No products found");
    return;
  }

  console.log(`Testing with: ${product.name}\n`);

  // Read reference image and convert to base64
  const referenceImagePath = path.join(
    process.cwd(),
    "public",
    "reference-image.png"
  );

  try {
    const imageBuffer = await fs.readFile(referenceImagePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString("base64")}`;

    console.log("✅ Reference image loaded\n");

    // Prepare the prompt - just the product name change
    const prompt = `Product photography of coffee bag with "${product.name.toUpperCase()}" label, same style as reference image, colorful geometric pattern, Artisan Roast branding, professional product photography`;

    console.log(`📝 Prompt: ${prompt}\n`);
    console.log("🔄 Sending request to Replicate...\n");

    // Call Replicate API with img2img
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version:
          "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL img2img
        input: {
          image: base64Image,
          prompt: prompt,
          negative_prompt: "blurry, low quality, distorted, ugly, watermark",
          prompt_strength: 0.7, // How much to modify from reference (0.0 = exact copy, 1.0 = totally new)
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Replicate API error:", error);
      return;
    }

    const prediction = await response.json();
    console.log("✅ Prediction created, waiting for result...\n");

    // Poll for result
    let result = prediction;
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_KEY}`,
          },
        }
      );

      result = await pollResponse.json();
      console.log(`⏳ Status: ${result.status}...`);
    }

    if (result.status === "failed") {
      console.error("❌ Generation failed:", result.error);
      return;
    }

    const outputUrl = Array.isArray(result.output)
      ? result.output[0]
      : result.output;
    console.log("\n✅ Image generated!");
    console.log(`⬇️  Downloading...\n`);

    // Download image
    const imageResponse = await fetch(outputUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicDir = path.join(process.cwd(), "public", "products");
    await fs.mkdir(publicDir, { recursive: true });

    const filename = "replicate-test.webp";
    const filepath = path.join(publicDir, filename);
    await fs.writeFile(filepath, buffer);

    console.log(`✅ Test image saved: public/products/${filename}`);
    console.log(`\n💡 Open the image to see if it matches your style!`);
    console.log(`💰 This cost approximately $0.02-0.10`);
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
