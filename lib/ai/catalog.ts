import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

let _catalogSnapshot: string | null = null;
let _catalogSnapshotAt = 0;
const CATALOG_SNAPSHOT_TTL_MS = 5 * 60 * 1000;

export async function buildCatalogSnapshot(): Promise<string> {
  if (_catalogSnapshot !== null && Date.now() - _catalogSnapshotAt < CATALOG_SNAPSHOT_TTL_MS) {
    return _catalogSnapshot;
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [products, topSellerRows] = await Promise.all([
      prisma.product.findMany({
        where: { isDisabled: false },
        select: {
          id: true,
          name: true,
          type: true,
          roastLevel: true,
          tastingNotes: true,
          origin: true,
          createdAt: true,
          variants: {
            where: { isDisabled: false },
            select: {
              stockQuantity: true,
              purchaseOptions: { select: { salePriceInCents: true } },
            },
          },
        },
        orderBy: { name: "asc" as const },
      }),
      prisma.$queryRaw<Array<{ productId: string }>>`
        SELECT pv."productId"
        FROM "OrderItem" oi
        JOIN "PurchaseOption" po ON oi."purchaseOptionId" = po.id
        JOIN "ProductVariant" pv ON po."variantId" = pv.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${thirtyDaysAgo}
          AND o.status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY pv."productId"
        ORDER BY COUNT(oi.id) DESC
        LIMIT 3
      `,
    ]);

    const topSellerIds = new Set(topSellerRows.map((r) => r.productId));

    const coffeeLines = products
      .filter((p) => p.type === ProductType.COFFEE)
      .map((p) => {
        const parts: string[] = [p.name];
        if (p.roastLevel) parts.push(`[${p.roastLevel.toLowerCase()}]`);
        const origins = p.origin.join(", ");
        if (origins) parts.push(origins);
        if (p.tastingNotes.length) parts.push(p.tastingNotes.join(", "));
        return `- ${parts.join(" — ")}`;
      });

    const merchLines = products
      .filter((p) => p.type !== ProductType.COFFEE)
      .map((p) => `- ${p.name}`);

    let snapshot = "";
    if (coffeeLines.length > 0) {
      snapshot += `Coffees in the shop:\n${coffeeLines.join("\n")}`;
    }
    if (merchLines.length > 0) {
      if (snapshot) snapshot += "\n\n";
      snapshot += `Merchandise:\n${merchLines.join("\n")}`;
    }

    const intelligenceLines: string[] = [];

    const topSellers = products.filter((p) => topSellerIds.has(p.id)).map((p) => p.name);
    if (topSellers.length > 0) {
      intelligenceLines.push(`Top sellers this month: ${topSellers.join(", ")}`);
    }

    const newArrivals = products.filter((p) => p.createdAt >= thirtyDaysAgo).map((p) => p.name);
    if (newArrivals.length > 0) {
      intelligenceLines.push(`New arrivals: ${newArrivals.join(", ")}`);
    }

    const onSale = products
      .filter((p) =>
        p.variants.some((v) => v.purchaseOptions.some((po) => po.salePriceInCents !== null))
      )
      .map((p) => p.name);
    if (onSale.length > 0) {
      intelligenceLines.push(`On sale: ${onSale.join(", ")}`);
    }

    const LOW_STOCK_THRESHOLD = 5;
    const lowStock = products
      .filter((p) =>
        p.variants.some((v) => v.stockQuantity > 0 && v.stockQuantity <= LOW_STOCK_THRESHOLD)
      )
      .map((p) => p.name);
    if (lowStock.length > 0) {
      intelligenceLines.push(`Low stock (mention urgency if relevant): ${lowStock.join(", ")}`);
    }

    if (intelligenceLines.length > 0) {
      if (snapshot) snapshot += "\n\n";
      snapshot += `Store signals:\n${intelligenceLines.join("\n")}`;
    }

    _catalogSnapshot = snapshot;
    _catalogSnapshotAt = Date.now();
    return snapshot;
  } catch {
    return _catalogSnapshot ?? "";
  }
}