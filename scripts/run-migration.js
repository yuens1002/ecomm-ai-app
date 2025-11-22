/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Error loading .env.local:", result.error);
  process.exit(1);
}

console.log("Loaded environment variables from .env.local");

try {
  // Run the prisma migration command with the loaded environment
  execSync("npx prisma migrate dev --name add_label_to_category", {
    stdio: "inherit",
    env: { ...process.env, ...result.parsed },
  });
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
}
