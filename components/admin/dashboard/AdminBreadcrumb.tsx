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

/**
 * Maps route prefixes to their parent nav category
 */
const navCategoryMap: Record<string, { label: string; href?: string }> = {
  // Dashboard
  analytics: { label: "Dashboard" },
  // Products
  products: { label: "Products" },
  merch: { label: "Products" },
  "product-menu": { label: "Products" },
  // Orders
  orders: { label: "Orders" },
  // Pages
  pages: { label: "Pages" },
  // More (Management + Settings)
  users: { label: "More" },
  newsletter: { label: "More" },
  settings: { label: "More" },
  "social-links": { label: "More" },
};

/**
 * Maps route segments to human-readable labels
 */
const routeLabels: Record<string, string> = {
  admin: "Dashboard",
  analytics: "Analytics",
  orders: "Orders",
  products: "Coffees",
  merch: "Merchandise",
  "product-menu": "Menu Builder",
  pages: "Pages",
  about: "About",
  cafe: "Cafe",
  faq: "FAQ",
  link: "Link Pages",
  new: "New",
  edit: "Edit",
  users: "All Users",
  newsletter: "Newsletter",
  settings: "General",
  storefront: "Store Front",
  location: "Location",
  commerce: "Commerce",
  marketing: "Marketing",
  contact: "Contact",
  "social-links": "Social Links",
};

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
 * Get label for a route segment
 */
function getLabel(segment: string): string {
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }

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

  // Get the first segment after /admin to determine nav category
  const firstSegment = segments[1];
  const navCategory = navCategoryMap[firstSegment];

  // Check if this is the Menu Builder page with a view param
  const isMenuBuilder = firstSegment === "product-menu";
  const viewParam = searchParams.get("view");

  // Determine if custom items will be the "last" items
  const hasCustomItems = customItems.length > 0;

  // Build breadcrumb items (skip "admin" segment)
  const pageSegments = segments.slice(1);
  let items = pageSegments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 2).join("/");
    let label = getLabel(segment);
    // Item is last only if there are no custom items AND it's the last segment
    const isLast = !hasCustomItems && index === pageSegments.length - 1;

    // For Menu Builder, use the view name from query param
    if (isMenuBuilder && segment === "product-menu" && viewParam) {
      label = menuBuilderViewLabels[viewParam] || label;
    }

    return { href, label, isLast };
  });

  // If on Menu Builder with a view param, show the view-specific breadcrumb
  if (isMenuBuilder && viewParam && items.length === 1) {
    // For label/category views, show "Labels" or "Categories" as parent
    const parentView = viewParam === "label" ? "all-labels" : viewParam === "category" ? "all-categories" : null;

    if (parentView && hasCustomItems) {
      // Show parent view as clickable link, custom item will be the page
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

        {/* Nav category (if different from first item label) */}
        {navCategory && navCategory.label !== items[0]?.label && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">{navCategory.label}</span>
            </BreadcrumbItem>
          </>
        )}

        {/* Page segments */}
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
