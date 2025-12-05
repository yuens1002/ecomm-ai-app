"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Tags,
  FileText,
  Mail,
  Settings,
  BarChart3,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { PageType } from "@prisma/client";

interface Page {
  id: string;
  slug: string;
  title: string;
  type: PageType;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function buildContentSection(pages: Page[]): NavSection {
  const items: NavItem[] = [];

  // Add CMS pages (ABOUT, CAFE, FAQ)
  for (const page of pages) {
    if (page.type === "ABOUT") {
      items.push({
        title: "About Page",
        href: "/admin/pages/about",
        icon: FileText,
      });
    } else if (page.type === "CAFE") {
      items.push({
        title: "Cafe Page",
        href: "/admin/pages/cafe",
        icon: FileText,
      });
    } else if (page.type === "FAQ") {
      items.push({
        title: "FAQ Page",
        href: "/admin/pages/faq",
        icon: FileText,
      });
    } else if (page.type === "LINK") {
      items.push({
        title: page.title,
        href: `/admin/pages/link/${page.slug}`,
        icon: ExternalLink,
      });
    }
  }

  return {
    title: "Content",
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
        href: "/admin/products",
        icon: Package,
      },
      {
        title: "Categories",
        href: "/admin/categories",
        icon: Tags,
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
        title: "Site Settings",
        href: "/admin/settings",
        icon: Settings,
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
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        collapsed && "justify-center"
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
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
