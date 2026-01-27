import {
  LayoutDashboard,
  BarChart3,
  Coffee,
  ShoppingBag,
  Grid3X3,
  Tags,
  SquareMenu,
  ClipboardList,
  RefreshCw,
  FileText,
  Users,
  Mail,
  Settings,
  Store,
  MapPin,
  CreditCard,
  Megaphone,
  Phone,
  Share2,
  type LucideIcon,
} from "lucide-react";

export type NavChild = {
  label: string;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
  disabledLabel?: string; // e.g., "coming soon"
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
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Products",
    icon: Coffee,
    children: [
      { label: "Coffees", href: "/admin/products", icon: Coffee },
      { label: "Merch", href: "/admin/merch", icon: ShoppingBag },
      {
        label: "Categories",
        href: "/admin/product-menu?view=categories",
        icon: Grid3X3,
      },
      { label: "Labels", href: "/admin/product-menu?view=labels", icon: Tags },
      { label: "Menu", href: "/admin/product-menu?view=menu", icon: SquareMenu },
    ],
  },
  {
    label: "Orders",
    icon: ClipboardList,
    children: [
      { label: "All Orders", href: "/admin/orders", icon: ClipboardList },
      {
        label: "Subscriptions",
        href: "#",
        icon: RefreshCw,
        disabled: true,
        disabledLabel: "coming soon",
      },
    ],
  },
  {
    label: "Pages",
    icon: FileText,
    children: [
      { label: "About", href: "/admin/pages/about", icon: FileText },
      { label: "Cafe", href: "/admin/pages/cafe", icon: FileText },
      { label: "FAQ", href: "/admin/pages/faq", icon: FileText },
    ],
  },
  {
    label: "Management",
    icon: Users,
    children: [
      { label: "All Users", href: "/admin/users", icon: Users },
      { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "General", href: "/admin/settings", icon: Settings },
      { label: "Store Front", href: "/admin/settings/storefront", icon: Store },
      { label: "Location", href: "/admin/settings/location", icon: MapPin },
      {
        label: "Commerce",
        href: "/admin/settings/commerce",
        icon: CreditCard,
      },
      {
        label: "Marketing",
        href: "/admin/settings/marketing",
        icon: Megaphone,
      },
      { label: "Contact", href: "/admin/settings/contact", icon: Phone },
      { label: "Social Links", href: "/admin/social-links", icon: Share2 },
    ],
  },
];

/**
 * Check if a nav item or any of its children is active based on current pathname
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href) {
    return pathname === item.href;
  }

  if (item.children) {
    return item.children.some((child) => {
      // Exact match for overview
      if (child.href === "/admin" && pathname === "/admin") {
        return true;
      }
      // For other routes, check if pathname starts with href (but not /admin itself)
      if (child.href !== "/admin" && pathname.startsWith(child.href.split("?")[0])) {
        return true;
      }
      return false;
    });
  }

  return false;
}

/**
 * Get the active child item for a nav item
 */
export function getActiveChild(
  item: NavItem,
  pathname: string
): NavChild | undefined {
  if (!item.children) return undefined;

  return item.children.find((child) => {
    if (child.href === "/admin" && pathname === "/admin") {
      return true;
    }
    if (child.href !== "/admin" && pathname.startsWith(child.href.split("?")[0])) {
      return true;
    }
    return false;
  });
}
