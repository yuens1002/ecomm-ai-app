import sharp from "sharp";
import path from "path";

async function createCleanReference() {
  console.log("Creating clean reference image without text...\n");

  const inputPath = path.join(process.cwd(), "public", "sample.webp");
  const outputPath = path.join(process.cwd(), "public", "reference-clean.webp");

  // Load the image and create a simple geometric pattern version
  // Since we can't easily remove text, we'll create a clean base with just the style
  await sharp(inputPath)
    .blur(50) // Heavy blur to remove text details
    .modulate({
      brightness: 1.1,
      saturation: 0.9,
    })
    .toFile(outputPath);

  console.log(`✅ Clean reference saved: ${outputPath}`);
  console.log(
    "This version has text blurred out for AI to add fresh branding\n"
  );
}

createCleanReference().catch(console.error);
