"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Maps route segments to human-readable labels
 */
const routeLabels: Record<string, string> = {
  admin: "Dashboard",
  analytics: "Analytics",
  orders: "Orders",
  products: "Products",
  merch: "Merchandise",
  "product-menu": "Menu Builder",
  pages: "Pages",
  about: "About",
  cafe: "Cafe",
  faq: "FAQ",
  link: "Link Pages",
  new: "New",
  edit: "Edit",
  users: "Users",
  newsletter: "Newsletter",
  settings: "Settings",
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
  // Check direct mapping first
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }

  // For dynamic segments (IDs, slugs), return a formatted version
  // Skip UUIDs and just show a generic label
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

  // Build breadcrumb items
  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = getLabel(segment);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItem key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            {item.isLast ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={item.href}>{item.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
