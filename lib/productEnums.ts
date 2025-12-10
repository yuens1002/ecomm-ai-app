import type { ProductType, RoastLevel } from "@prisma/client";

export const PRODUCT_TYPES = [
  "COFFEE",
  "MERCH",
] as const satisfies readonly ProductType[];

export const ROAST_LEVELS = [
  "LIGHT",
  "MEDIUM",
  "DARK",
] as const satisfies readonly RoastLevel[];
