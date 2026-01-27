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

  // Build breadcrumb items (skip the first "admin" segment since we use home icon)
  const items = segments.slice(1).map((segment, index) => {
    const href = "/" + segments.slice(0, index + 2).join("/");
    const label = getLabel(segment);
    const isLast = index === segments.length - 2;

    return { href, label, isLast };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* Home icon linking to /admin */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin" className="flex items-center">
              <Home className="h-4 w-4" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item) => (
          <BreadcrumbItem key={item.href}>
            <BreadcrumbSeparator />
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
