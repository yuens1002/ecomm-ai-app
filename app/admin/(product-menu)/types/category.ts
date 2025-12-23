import { z } from "zod";

/**
 * Schema for creating a category label
 */
export const createCategoryLabelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().nullable().optional(),
  afterLabelId: z.string().nullable().optional(),
});

export type CreateCategoryLabel = z.infer<typeof createCategoryLabelSchema>;

/**
 * Schema for updating a category label with visibility fields
 */
export const updateCategoryLabelSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  icon: z.string().nullable().optional(),
  isVisible: z.boolean().optional(),
  autoOrder: z.boolean().optional(),
  showInHeaderMenu: z.boolean().optional(),
  showInMobileMenu: z.boolean().optional(),
  showInFooterMenu: z.boolean().optional(),
});

export type UpdateCategoryLabel = z.infer<typeof updateCategoryLabelSchema>;

/**
 * Schema for creating a category
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  labelIds: z.array(z.string()).optional(),
});

export type CreateCategory = z.infer<typeof createCategorySchema>;

/**
 * Schema for updating a category with visibility fields
 */
export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  labelIds: z.array(z.string()).optional(),
  isVisible: z.boolean().optional(),
  showInHeaderMenu: z.boolean().optional(),
  showInMobileMenu: z.boolean().optional(),
  showInFooterMenu: z.boolean().optional(),
});

export type UpdateCategory = z.infer<typeof updateCategorySchema>;
