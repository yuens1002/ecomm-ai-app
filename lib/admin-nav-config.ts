import {
  LayoutDashboard,
  Package,
  ClipboardList,
  FileText,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export type NavChild = {
  label: string;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
  disabledLabel?: string; // e.g., "coming soon"
  section?: string; // Section header for grouping
};

export type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string; // Direct link (no dropdown)
  children?: NavChild[];
};

export const adminNavConfig: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { label: "Overview", href: "/admin" },
      { label: "Analytics", href: "/admin/analytics" },
    ],
  },
  {
    label: "Products",
    icon: Package,
    children: [
      { label: "Coffees", href: "/admin/products" },
      { label: "Merch", href: "/admin/merch" },
      { label: "Categories", href: "/admin/product-menu?view=all-categories" },
      { label: "Labels", href: "/admin/product-menu?view=all-labels" },
      { label: "Menu", href: "/admin/product-menu?view=menu" },
    ],
  },
  {
    label: "Orders",
    icon: ClipboardList,
    children: [
      { label: "All Orders", href: "/admin/orders" },
      {
        label: "Subscriptions",
        href: "#",
        disabled: true,
        disabledLabel: "coming soon",
      },
    ],
  },
  {
    label: "Pages",
    icon: FileText,
    children: [
      { label: "About", href: "/admin/pages/about" },
      { label: "Cafe", href: "/admin/pages/cafe" },
      { label: "FAQ", href: "/admin/pages/faq" },
    ],
  },
  {
    label: "More",
    icon: MoreHorizontal,
    children: [
      { label: "All Users", href: "/admin/users", section: "Management" },
      { label: "Newsletter", href: "/admin/newsletter" },
      { label: "General", href: "/admin/settings", section: "Settings" },
      { label: "Store Front", href: "/admin/settings/storefront" },
      { label: "Location", href: "/admin/settings/location" },
      { label: "Commerce", href: "/admin/settings/commerce" },
      { label: "Marketing", href: "/admin/settings/marketing" },
      { label: "Contact", href: "/admin/settings/contact" },
      { label: "Social Links", href: "/admin/social-links" },
    ],
  },
];

/**
 * Check if a nav child link is active based on current URL
 * Handles both pathname-only and query param URLs
 */
export function isNavChildActive(
  child: NavChild,
  pathname: string,
  searchParams?: URLSearchParams
): boolean {
  // Exact match for admin overview
  if (child.href === "/admin") {
    return pathname === "/admin";
  }

  // For links with query params, compare the full URL
  const childHasQuery = child.href.includes("?");
  if (childHasQuery && searchParams) {
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    return currentUrl === child.href;
  }

  // For links without query params, use startsWith on pathname
  return pathname.startsWith(child.href.split("?")[0]);
}

/**
 * Check if a nav item or any of its children is active based on current pathname
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href) {
    return pathname === item.href;
  }

  if (item.children) {
    return item.children.some((child) => isNavChildActive(child, pathname));
  }

  return false;
}

/**
 * Get the active child item for a nav item
 */
export function getActiveChild(
  item: NavItem,
  pathname: string,
  searchParams?: URLSearchParams
): NavChild | undefined {
  if (!item.children) return undefined;

  return item.children.find((child) => isNavChildActive(child, pathname, searchParams));
}
