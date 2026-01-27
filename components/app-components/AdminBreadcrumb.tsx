"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

export default function AdminBreadcrumb() {
  const pathname = usePathname();

  // Split pathname into segments, filtering out empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Hide breadcrumb on overview page (/admin)
  if (segments.length <= 1) {
    return null;
  }

  // Get the first segment after /admin to determine nav category
  const firstSegment = segments[1];
  const navCategory = navCategoryMap[firstSegment];

  // Build breadcrumb items (skip "admin" segment)
  const pageSegments = segments.slice(1);
  const items = pageSegments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 2).join("/");
    const label = getLabel(segment);
    const isLast = index === pageSegments.length - 1;

    return { href, label, isLast };
  });

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
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{item.label}</span>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
