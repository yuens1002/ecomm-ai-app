import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

config({ path: ".env.local" });

const prisma = new PrismaClient();
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = "https://api.x.ai/v1/images/generations";

async function generateTestImage() {
  console.log("\n🎨 Testing Grok image generation with specific style...\n");

  if (!GROK_API_KEY) {
    console.error("❌ GROK_API_KEY not found in .env.local");
    return;
  }

  const product = await prisma.product.findFirst();
  if (!product) {
    console.log("No products found");
    return;
  }

  console.log(`Testing with: ${product.name}\n`);

  // Specific prompt with branding
  const prompt = `Professional product photography of a coffee package. Minimalist design with clean white/light gray background. The package is a white flat rectangular box shown straight on slightly from below. The coffee should be branded "artisan roast" with a bright color rectangular box denoting "costa rica tarrazu" at the upper left corner. Show the entire package, no cropping.`;

  console.log(`📝 Prompt: ${prompt}\n`);
  console.log("🔄 Calling Grok API...\n");

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
    const error = await response.text();
    console.error("❌ Grok API error:", error);
    return;
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    console.error("❌ No image URL in response");
    return;
  }

  console.log(`✅ Image generated: ${imageUrl}\n`);
  console.log("📥 Downloading image...\n");

  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  const publicDir = path.join(process.cwd(), "public", "products");
  await fs.mkdir(publicDir, { recursive: true });

  const filename = "grok-test-detailed.webp";
  const filepath = path.join(publicDir, filename);
  await fs.writeFile(filepath, Buffer.from(imageBuffer));

  console.log(`✅ Test image saved: public/products/${filename}`);
  console.log(`💰 Cost: ~$0.07\n`);
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
