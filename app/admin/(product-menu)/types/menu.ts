import { z } from "zod";

/**
 * Shared "read model" types for product-menu pages.
 * These represent what the UI consumes (tables/builder).
 */

export const menuCategoryInLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  order: z.number(),
});
export type MenuCategoryInLabel = z.infer<typeof menuCategoryInLabelSchema>;

export const menuLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  order: z.number(),
  isVisible: z.boolean(),
  autoOrder: z.boolean(),
  showInHeaderMenu: z.boolean(),
  showInMobileMenu: z.boolean(),
  showInFooterMenu: z.boolean(),
  categories: z.array(menuCategoryInLabelSchema),
});
export type MenuLabel = z.infer<typeof menuLabelSchema>;

export const menuLabelForCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  order: z.number(),
});
export type MenuLabelForCategory = z.infer<typeof menuLabelForCategorySchema>;

export const productMenuSettingsSchema = z.object({
  icon: z.string().min(1),
  text: z.string().min(1).max(20),
});
export type ProductMenuSettings = z.infer<typeof productMenuSettingsSchema>;

export const menuLabelCategoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  order: z.number(),
});
export type MenuLabelCategoryItem = z.infer<typeof menuLabelCategoryItemSchema>;

export const menuCategoryLabelItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable().optional(),
  order: z.number(),
});
export type MenuCategoryLabelItem = z.infer<typeof menuCategoryLabelItemSchema>;

export const menuCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  order: z.number(),
  isVisible: z.boolean(),
  showInHeaderMenu: z.boolean(),
  showInMobileMenu: z.boolean(),
  showInFooterMenu: z.boolean(),
  productCount: z.number(),
  labels: z.array(menuCategoryLabelItemSchema),
});
export type MenuCategory = z.infer<typeof menuCategorySchema>;

export const productMenuDataSchema = z.object({
  labels: z.array(menuLabelSchema),
  categories: z.array(menuCategorySchema),
  settings: productMenuSettingsSchema,
});
export type ProductMenuData = z.infer<typeof productMenuDataSchema>;
