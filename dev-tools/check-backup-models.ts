/**
 * Validates that the backup script's table list matches current Prisma models.
 * Fails fast if a listed table is missing or if new models are not backed up.
 */
import { Prisma } from "@prisma/client";

const backupTables = [
  "user",
  "account",
  "session",
  "verificationToken",
  "passwordResetToken",
  "address",
  "categoryLabel",
  "category",
  "categoryLabelCategory",
  "categoriesOnProducts",
  "product",
  "productImage",
  "productVariant",
  "purchaseOption",
  "addOnLink",
  "order",
  "orderItem",
  "subscription",
  "newsletterSubscriber",
  "siteSettings",
  "socialLink",
  "tag",
  "productTag",
  "page",
  "block",
  "aiTokenUsage",
  "userActivity",
  "productMenuDraft",
];

function toClientName(modelName: string) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function main() {
  const modelClientNames = new Set(
    Prisma.dmmf.datamodel.models.map((m) => toClientName(m.name))
  );

  const missing = backupTables.filter((t) => !modelClientNames.has(t));
  const uncovered = Array.from(modelClientNames).filter(
    (m) => !backupTables.includes(m)
  );

  if (missing.length === 0 && uncovered.length === 0) {
    console.log("✅ Backup table list matches current Prisma models.");
    return;
  }

  if (missing.length) {
    console.error(
      "❌ Tables listed in backup but not found as Prisma models:",
      missing
    );
  }

  if (uncovered.length) {
    console.error(
      "❌ Prisma models not included in backup table list (add to backup):",
      uncovered
    );
  }

  process.exit(1);
}

main();
