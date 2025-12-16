import { z } from "zod";
import { ProductType, RoastLevel } from "@prisma/client";

/**
 * Zod validation schemas for product API endpoints
 */

// Base schema for common fields (both coffee and merch)
const baseProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  images: z
    .array(
      z.object({
        url: z
          .string()
          .url("Image URL must be valid")
          .or(
            z
              .string()
              .regex(/^\//, "Image URL must be valid")
          ),
        alt: z.string().default(""),
      })
    )
    .optional(),
  isOrganic: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isDisabled: z.boolean().default(false),
  categoryIds: z.array(z.string()).default([]),
  productType: z.nativeEnum(ProductType),
});

// Coffee-specific fields schema
const coffeeFieldsSchema = z.object({
  roastLevel: z.nativeEnum(RoastLevel),
  origin: z
    .array(z.string().min(1))
    .min(1, "At least one origin is required for coffee products"),
  variety: z.string().optional().nullable(),
  altitude: z.string().optional().nullable(),
  tastingNotes: z.array(z.string().min(1)).default([]),
});

// Merch product schema (base fields only, coffee fields null/empty)
const merchProductSchema = baseProductSchema.extend({
  productType: z.literal(ProductType.MERCH),
  roastLevel: z.null().optional(),
  origin: z.array(z.never()).optional().default([]),
  variety: z.null().optional(),
  altitude: z.null().optional(),
  tastingNotes: z.array(z.never()).optional().default([]),
});

// Coffee product schema (base + coffee-specific fields)
const coffeeProductSchema = baseProductSchema
  .extend({
    productType: z.literal(ProductType.COFFEE),
  })
  .merge(coffeeFieldsSchema);

// Discriminated union for create
export const productCreateSchema = z.discriminatedUnion("productType", [
  coffeeProductSchema,
  merchProductSchema,
]);

// Update schemas - make all fields except productType optional
const coffeeProductUpdateSchema = baseProductSchema
  .extend({
    productType: z.literal(ProductType.COFFEE),
  })
  .merge(coffeeFieldsSchema)
  .partial()
  .required({ productType: true });

const merchProductUpdateSchema = merchProductSchema
  .partial()
  .required({ productType: true });

export const productUpdateSchema = z.discriminatedUnion("productType", [
  coffeeProductUpdateSchema,
  merchProductUpdateSchema,
]);

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
