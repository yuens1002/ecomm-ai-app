import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

/**
 * Backfills legacy ProductAddOn rows into the new AddOnLink schema.
 * Safe to run when the legacy table is missing or empty.
 *
 * Usage: npx tsx dev-tools/backfill-add-on-links.ts
 */
async function main() {
  console.log("🔄 Backfill: ProductAddOn -> AddOnLink\n");

  // Detect legacy table existence
  const [{ exists } = { exists: false }] = (await prisma.$queryRawUnsafe(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ProductAddOn') as exists;"
  )) as Array<{ exists: boolean }>;

  if (!exists) {
    console.log("ℹ️  Legacy table ProductAddOn not found. Nothing to migrate.");
    return;
  }

  const legacyRows = (await prisma.$queryRawUnsafe(
    'SELECT "id", "productId", "addOnProductId", "addOnVariantId", "discountedPriceInCents" FROM "ProductAddOn";'
  )) as Array<{
    id: string;
    productId: string;
    addOnProductId: string;
    addOnVariantId: string | null;
    discountedPriceInCents: number | null;
  }>;

  if (legacyRows.length === 0) {
    console.log("ℹ️  Legacy ProductAddOn table is empty. Nothing to migrate.");
    return;
  }

  console.log(`Found ${legacyRows.length} legacy add-ons. Migrating...`);

  for (const row of legacyRows) {
    await prisma.addOnLink.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id || randomUUID(),
        primaryProductId: row.productId,
        primaryVariantId: null, // legacy table had no primary variant
        addOnProductId: row.addOnProductId,
        addOnVariantId: row.addOnVariantId,
        discountedPriceInCents: row.discountedPriceInCents ?? null,
      },
    });
  }

  console.log(
    "✅ Migration complete. You can drop ProductAddOn after verifying."
  );
}

main()
  .catch((err) => {
    console.error("❌ Backfill failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
