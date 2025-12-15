"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  SquareMenu,
  FileText,
  Mail,
  Settings,
  BarChart3,
  ChevronRight,
  ExternalLink,
  ToyBrick,
  SlidersHorizontal,
  Store,
  MapPin,
  Scale,
  Megaphone,
  Share2,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { PageType } from "@prisma/client";

// Mask-based icon so the SVG inherits current text color (works for active state inversion)
function CoffeeBeanIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-5 w-5", className)}
      style={{
        maskImage: "url(/beans.svg)",
        WebkitMaskImage: "url(/beans.svg)",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        backgroundColor: "currentColor",
      }}
    />
  );
}

interface Page {
  id: string;
  slug: string;
  title: string;
  type: PageType;
  showInHeader: boolean;
  showInFooter: boolean;
  headerOrder: number | null;
  footerOrder: number | null;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  order?: number;
  isLabel?: boolean;
  isChild?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function buildContentSection(pages: Page[]): NavSection {
  const items: NavItem[] = [];

  // Build items with order for sorting
  for (const page of pages) {
    // Determine sort order: prioritize header order, fallback to footer order, then use high number
    const order =
      page.showInHeader && page.headerOrder !== null
        ? page.headerOrder
        : page.showInFooter && page.footerOrder !== null
          ? page.footerOrder + 1000 // Add offset to keep footer items after header items
          : 9999; // Pages not in nav go to bottom

    if (page.type === "ABOUT") {
      items.push({
        title: "About",
        href: "/admin/pages/about",
        icon: FileText,
        order,
      });
    } else if (page.type === "CAFE") {
      items.push({
        title: "Cafe",
        href: "/admin/pages/cafe",
        icon: FileText,
        order,
      });
    } else if (page.type === "FAQ") {
      items.push({
        title: "FAQ",
        href: "/admin/pages/faq",
        icon: FileText,
        order,
      });
    } else if (page.type === "LINK") {
      items.push({
        title: page.title,
        href: `/admin/pages/link/${page.slug}`,
        icon: ExternalLink,
        order,
      });
    }
  }

  // Sort by order
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    title: "Pages",
    items,
  };
}

const staticNavSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "E-commerce",
    items: [
      {
        title: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
      },
      {
        title: "Products",
        href: "#products",
        icon: Package,
        isLabel: true,
      },
      {
        title: "Coffee",
        href: "/admin/products",
        icon: CoffeeBeanIcon,
        isChild: true,
      },
      {
        title: "Merch",
        href: "/admin/merch",
        icon: ToyBrick,
        isChild: true,
      },
      {
        title: "Product Menu",
        href: "/admin/categories",
        icon: SquareMenu,
      },
    ],
  },
  {
    title: "Users",
    items: [
      {
        title: "All Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Newsletter",
        href: "/admin/newsletter",
        icon: Mail,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "General",
        href: "/admin/settings",
        icon: SlidersHorizontal,
        isChild: true,
      },
      {
        title: "Store Front",
        href: "/admin/settings/storefront",
        icon: Store,
        isChild: true,
      },
      {
        title: "Location",
        href: "/admin/settings/location",
        icon: MapPin,
        isChild: true,
      },
      {
        title: "Commerce",
        href: "/admin/settings/commerce",
        icon: Scale,
        isChild: true,
      },
      {
        title: "Marketing",
        href: "/admin/settings/marketing",
        icon: Megaphone,
        isChild: true,
      },
      {
        title: "Social Media",
        href: "/admin/social-links",
        icon: Share2,
        isChild: true,
      },
      {
        title: "Contact",
        href: "/admin/settings/contact",
        icon: Phone,
        isChild: true,
      },
    ],
  },
];

export default function AdminSidebar({ pages }: { pages: Page[] }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Build navigation sections with dynamic Content section
  const navSections: NavSection[] = [
    staticNavSections[0], // Dashboard
    buildContentSection(pages), // Content (dynamic)
    ...staticNavSections.slice(1), // E-commerce, Users, Settings
  ];

  return (
    <aside
      className={cn(
        "bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  A
                </span>
              </div>
              <span className="font-semibold">Admin</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-muted rounded-md transition-colors ml-auto"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronRight
              className={cn(
                "h-5 w-5 transition-transform",
                !collapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  if (item.isLabel) {
                    return (
                      <div
                        key={item.title}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                          collapsed && "justify-center"
                        )}
                        title={collapsed ? item.title : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex-1">{item.title}</span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        collapsed
                          ? "justify-center"
                          : item.isChild
                            ? "pl-6"
                            : ""
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      {Icon && <Icon className="h-5 w-5 shrink-0" />}
                      {!collapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to Store
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
