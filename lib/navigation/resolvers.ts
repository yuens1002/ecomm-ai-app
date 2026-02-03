"use server";

/**
 * Server-only breadcrumb resolvers.
 *
 * These functions fetch entity data from the database to build dynamic breadcrumbs.
 * They are NOT used in the client-side navigation context to avoid bundling Prisma.
 *
 * For dynamic entity names in breadcrumbs, page components should use
 * BreadcrumbContext's useBreadcrumb() hook with data they already have.
 */

import { prisma } from "@/lib/prisma";
import type { BreadcrumbResolver } from "./types";

/**
 * Breadcrumb Resolvers
 *
 * These functions build dynamic breadcrumb chains for routes where
 * labels must be fetched from the database at runtime.
 *
 * Each resolver returns the complete breadcrumb trail from root to current page.
 */

/**
 * Resolver for product edit page.
 * Returns: Home > Products > Coffees > [Product Name]
 */
export const productEditResolver: BreadcrumbResolver = async (
  _pathname,
  searchParams
) => {
  const productId = searchParams.get("id");

  if (!productId) {
    return [
      { id: "admin", label: "Home", href: "/admin" },
      { id: "admin.products", label: "Products", href: null },
      { id: "admin.products.coffees", label: "Coffees", href: "/admin/products" },
    ];
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        name: true,
        categories: {
          where: { isPrimary: true },
          include: {
            category: {
              select: { name: true },
            },
          },
          take: 1,
        },
      },
    });

    if (!product) {
      return [
        { id: "admin", label: "Home", href: "/admin" },
        { id: "admin.products", label: "Products", href: null },
        { id: "admin.products.coffees", label: "Coffees", href: "/admin/products" },
        { id: "product", label: "Not Found", href: null },
      ];
    }

    return [
      { id: "admin", label: "Home", href: "/admin" },
      { id: "admin.products", label: "Products", href: null },
      { id: "admin.products.coffees", label: "Coffees", href: "/admin/products" },
      { id: "product", label: product.name, href: null },
    ];
  } catch {
    return [
      { id: "admin", label: "Home", href: "/admin" },
      { id: "admin.products", label: "Products", href: null },
      { id: "admin.products.coffees", label: "Coffees", href: "/admin/products" },
    ];
  }
};

/**
 * Resolver for single category view in Menu Builder.
 * Returns: Home > Products > Categories > [Category Name]
 */
export const categoryViewResolver: BreadcrumbResolver = async (
  _pathname,
  searchParams
) => {
  const categoryId = searchParams.get("categoryId");

  if (!categoryId) {
    return [
      { id: "admin", label: "Home", href: "/admin" },
      { id: "admin.products", label: "Products", href: null },
      { id: "admin.menu-builder.all-categories", label: "Categories", href: "/admin/product-menu?view=all-categories" },
    ];
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    if (!category) {
      return [
        { id: "admin", label: "Home", href: "/admin" },
        { id: "admin.products", label: "Products", href: null },
        { id: "admin.menu-builder.all-categories", label: "Categories", href: "/admin/product-menu?view=all-categories" },
        { id: "category", label: "Not Found", href: null },
      ];
    }

    return [
      { id: "admin", label: "Home", href: "/admin" },
      { id: "admin.products", label: "Products", href: null },
      { id: "admin.menu-builder.all-categories", label: "Categories", href: "/admin/product-menu?view=all-categories" },
      { id: "category", label: category.name, href: null },
    ];
  } catch {
    return [
      { id: "admin", label: "Home", href: "/admin" },
      { id: "admin.products", label: "Products", href: null },
      { id: "admin.menu-builder.all-categories", label: "Categories", href: "/admin/product-menu?view=all-categories" },
    ];
  }
};

/**
 * Resolver for single label view in Menu Builder.
 * Returns: Home > Products > Labels > [Label Name]
 */
export const labelViewResolver: BreadcrumbResolver = async (
  _pathname,
  searchParams
) => {
  const labelId = searchParams.get("labelId");

  if (!labelId) {
    return [
      { id: "admin", label: "Home", href: "/admin" },
      { id: "admin.products", label: "Products", href: null },
      { id: "admin.menu-builder.all-labels", label: "Labels", href: "/admin/product-menu?view=all-labels" },
    ];
  }

  try {
    const label = await prisma.categoryLabel.findUnique({
      where: { id: labelId },
      select: { name: true },
    });

    if (!label) {
      return [
        { id: "admin", label: "Home", href: "/admin" },
        { id: "admin.products", label: "Products", href: null },
        { id: "admin.menu-builder.all-labels", label: "Labels", href: "/admin/product-menu?view=all-labels" },
        { id: "label", label: "Not Found", href: null },
      ];
    }

    return [
      { id: "admin", label: "Home", href: "/admin" },
      { id: "admin.products", label: "Products", href: null },
      { id: "admin.menu-builder.all-labels", label: "Labels", href: "/admin/product-menu?view=all-labels" },
      { id: "label", label: label.name, href: null },
    ];
  } catch {
    return [
      { id: "admin", label: "Home", href: "/admin" },
      { id: "admin.products", label: "Products", href: null },
      { id: "admin.menu-builder.all-labels", label: "Labels", href: "/admin/product-menu?view=all-labels" },
    ];
  }
};

/**
 * Registry of all breadcrumb resolvers by name.
 * Used by navigation-core to look up resolvers for dynamic routes.
 */
export const breadcrumbResolvers: Record<string, BreadcrumbResolver> = {
  productEdit: productEditResolver,
  categoryView: categoryViewResolver,
  labelView: labelViewResolver,
};

/**
 * Get a breadcrumb resolver by name.
 */
export function getResolver(name: string): BreadcrumbResolver | undefined {
  return breadcrumbResolvers[name];
}
