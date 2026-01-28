"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbItems, type BreadcrumbItem as BreadcrumbItemType } from "./BreadcrumbContext";
import { findActiveNavigation } from "@/lib/admin-nav-config";

/**
 * Maps Menu Builder view query params to labels
 */
const menuBuilderViewLabels: Record<string, string> = {
  menu: "Menu",
  "all-labels": "Labels",
  "all-categories": "Categories",
  label: "Label",
  category: "Category",
};

/**
 * Get label for a route segment (fallback when not in nav config)
 */
function getLabel(segment: string): string {
  // For dynamic segments (IDs, slugs), return a formatted version
  if (segment.match(/^[a-z0-9-]{20,}$/i)) {
    return "Details";
  }

  // Capitalize and replace hyphens with spaces
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Renders breadcrumb item content based on state
 */
function BreadcrumbItemContent({
  item,
  isLast
}: {
  item: BreadcrumbItemType & { href?: string };
  isLast: boolean;
}) {
  if (isLast) {
    return <BreadcrumbPage>{item.label}</BreadcrumbPage>;
  }

  if (item.href) {
    return (
      <BreadcrumbLink asChild>
        <Link href={item.href} className="text-muted-foreground hover:text-foreground">
          {item.label}
        </Link>
      </BreadcrumbLink>
    );
  }

  return <span className="text-muted-foreground">{item.label}</span>;
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const customItems = useBreadcrumbItems();

  // Split pathname into segments, filtering out empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Hide breadcrumb on overview page (/admin)
  if (segments.length <= 1) {
    return null;
  }

  const firstSegment = segments[1];
  const hasCustomItems = customItems.length > 0;

  // Check if this is the Menu Builder page with a view param
  const isMenuBuilder = firstSegment === "product-menu";
  const viewParam = searchParams.get("view");

  // Try to find matching nav item from config (single source of truth)
  const { parent: navParent, child: navChild } = findActiveNavigation(pathname, searchParams);

  let category: string | null = null;
  let items: Array<{ href: string; label: string; isLast: boolean }> = [];

  if (isMenuBuilder && viewParam) {
    // Special handling for Menu Builder with view params
    category = "Products";
    const parentView = viewParam === "label" ? "all-labels" : viewParam === "category" ? "all-categories" : null;

    if (parentView && hasCustomItems) {
      items = [{
        href: `/admin/product-menu?view=${parentView}`,
        label: menuBuilderViewLabels[parentView] || "Menu Builder",
        isLast: false
      }];
    } else {
      items = [{
        href: `/admin/product-menu?view=${viewParam}`,
        label: menuBuilderViewLabels[viewParam] || "Menu Builder",
        isLast: !hasCustomItems
      }];
    }
  } else if (navParent && navChild) {
    // Use nav config for category and page label
    category = navParent.label;
    items = [{
      href: pathname,
      label: navChild.label,
      isLast: !hasCustomItems
    }];
  } else {
    // Fallback: build from URL segments for pages not in nav config
    const pageSegments = segments.slice(1);
    items = pageSegments.map((segment, index) => ({
      href: "/" + segments.slice(0, index + 2).join("/"),
      label: getLabel(segment),
      isLast: !hasCustomItems && index === pageSegments.length - 1
    }));
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* Home icon */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin" className="flex items-center">
              <Home className="h-4 w-4" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Nav category (always shown when available) */}
        {category && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">{category}</span>
            </BreadcrumbItem>
          </>
        )}

        {/* Page items */}
        {items.map((item) => (
          <span key={item.href} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbItemContent item={item} isLast={item.isLast} />
            </BreadcrumbItem>
          </span>
        ))}

        {/* Custom items from context (e.g., specific entity names) */}
        {customItems.map((item, index) => (
          <span key={`custom-${index}`} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbItemContent item={item} isLast={index === customItems.length - 1} />
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
