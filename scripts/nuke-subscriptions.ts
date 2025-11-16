// Load environment variables explicitly from .env.local
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { prisma } from "../lib/prisma";

async function nukeAllSubscriptions() {
  console.log("🗑️  Deleting all subscriptions from database...");
  
  const count = await prisma.subscription.count();
  console.log(`Found ${count} subscription(s) to delete`);
  
  if (count === 0) {
    console.log("✅ No subscriptions to delete");
    return;
  }
  
  const result = await prisma.subscription.deleteMany({});
  console.log(`✅ Deleted ${result.count} subscription(s)`);
  console.log("🎯 Database cleared. New subscriptions will be created from Stripe webhooks.");
}

async function main() {
  await nukeAllSubscriptions();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
