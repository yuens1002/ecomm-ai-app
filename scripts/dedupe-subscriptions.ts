// Load environment variables explicitly from .env.local
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";

// Backfill newly added optional stripePriceId field (older subscriptions may not have it)
async function backfillStripePriceIds() {
  const subsWithoutPriceId = await prisma.subscription.findMany({
    where: { stripePriceId: null },
  });
  if (subsWithoutPriceId.length === 0) {
    console.log("✅ No subscriptions need stripePriceId backfill");
    return;
  }
  console.log(`🔧 Backfilling stripePriceId for ${subsWithoutPriceId.length} subscriptions...`);
  for (const sub of subsWithoutPriceId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
      const item = stripeSub.items.data[0];
      const price = item.price;
      const stripePriceId = price.id;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { stripePriceId },
      });
      console.log(`  ↳ Updated ${sub.id} with price ${stripePriceId}`);
    } catch (err) {
      console.error(`  ❌ Failed priceId backfill for ${sub.id}:`, err);
    }
  }
}

async function dedupePerUserProduct() {
  const all = await prisma.subscription.findMany({ orderBy: { updatedAt: 'desc' } });
  const groups = new Map<string, typeof all>();
  for (const s of all) {
    if (!s.stripeProductId) continue; // skip until backfilled
    const key = `${s.userId}:${s.stripeProductId}`;
    if (!groups.has(key)) groups.set(key, [] as any);
    groups.get(key)!.push(s);
  }
  let removed = 0;
  for (const [key, subs] of groups) {
    if (subs.length <= 1) continue;
    // Keep the most recently updated ACTIVE (else first) subscription
    const keeper = subs.find(s => s.status === 'ACTIVE') || subs[0];
    const toRemove = subs.filter(s => s.id !== keeper.id);
    console.log(`♻️ Dedupe ${key}: keeping ${keeper.id}, removing ${toRemove.length}`);
    for (const r of toRemove) {
      try {
        await prisma.subscription.delete({ where: { id: r.id } });
        removed++;
      } catch (err) {
        console.error(`  ❌ Failed to delete ${r.id}`, err);
      }
    }
  }
  console.log(`✅ Dedupe complete. Removed ${removed} duplicate subscription records.`);
}

async function main() {
  await backfillStripePriceIds();
  await dedupePerUserProduct();
  console.log("🎯 Dedupe complete. stripeProductId already required; stripePriceId backfilled.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
