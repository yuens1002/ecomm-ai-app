"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ArrowLeft, Moon, Sun, LogOut, User, KeyRound, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { adminNavConfig, isNavItemActive, isNavChildActive, NavItem } from "@/lib/admin-nav-config";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { StoreBrand } from "./StoreBrand";

interface AdminTopNavProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  storeName: string;
  storeLogoUrl: string;
}

function NavDropdown({ item, pathname, searchParams }: { item: NavItem; pathname: string; searchParams: URLSearchParams }) {
  const isActive = isNavItemActive(item, pathname);
  const Icon = item.icon;

  return (
    <NavigationMenuPrimitive.Item className="relative">
      <NavigationMenuPrimitive.Trigger
        className={cn(
          "group inline-flex h-auto items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
          "data-[state=open]:bg-accent",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
        <ChevronDown
          className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </NavigationMenuPrimitive.Trigger>
      <NavigationMenuPrimitive.Content
        className={cn(
          "absolute left-0 top-full mt-1.5 w-48 rounded-md border bg-popover p-2 text-popover-foreground shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
      >
        <ul>
          {item.children?.map((child, index) => {
            const isChildActive = isNavChildActive(child, pathname, searchParams);

            // Render section header if present
            const sectionHeader = child.section ? (
              <li
                key={`section-${child.section}`}
                className={cn(
                  "px-2 py-1.5 text-xs font-medium text-muted-foreground",
                  index > 0 && "mt-2 border-t pt-2"
                )}
              >
                {child.section}
              </li>
            ) : null;

            if (child.disabled) {
              return (
                <React.Fragment key={child.href}>
                  {sectionHeader}
                  <li className="flex items-center justify-between px-2 py-1.5 text-sm text-muted-foreground opacity-50">
                    {child.label}
                    {child.disabledLabel && (
                      <span className="text-xs">({child.disabledLabel})</span>
                    )}
                  </li>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={child.href}>
                {sectionHeader}
                <li>
                  <NavigationMenuPrimitive.Link asChild>
                    <Link
                      href={child.href}
                      className={cn(
                        "block rounded-sm px-2 py-1.5 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isChildActive && "bg-accent font-medium"
                      )}
                    >
                      {child.label}
                    </Link>
                  </NavigationMenuPrimitive.Link>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      </NavigationMenuPrimitive.Content>
    </NavigationMenuPrimitive.Item>
  );
}

export function AdminTopNav({
  user,
  storeName,
  storeLogoUrl,
}: AdminTopNavProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "A";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Left section */}
          <div className="flex items-center">
            {/* Mobile menu drawer - negative margin offsets button's internal padding to align icon to edge */}
            <div className="-ml-4 lg:hidden">
              <AdminMobileDrawer storeName={storeName} />
            </div>

            {/* Back to public site - desktop only */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hidden lg:flex h-11 w-11 -ml-2.5"
              title="Open public site"
            >
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Open public site</span>
              </Link>
            </Button>

            {/* Logo/Brand - desktop only (in left section) */}
            <div className="hidden lg:flex items-center ml-1">
              <StoreBrand storeName={storeName} storeLogoUrl={storeLogoUrl} />
            </div>
          </div>

          {/* Center: Store branding for mobile/tablet - absolutely positioned */}
          <div className="absolute left-1/2 -translate-x-1/2 lg:hidden">
            <StoreBrand storeName={storeName} storeLogoUrl={storeLogoUrl} />
          </div>

          {/* Center: Navigation menu - desktop only */}
          <NavigationMenuPrimitive.Root className="hidden lg:flex">
            <NavigationMenuPrimitive.List className="flex items-center gap-1">
              {adminNavConfig.map((item) => (
                <NavDropdown key={item.label} item={item} pathname={pathname} searchParams={searchParams} />
              ))}
            </NavigationMenuPrimitive.List>
          </NavigationMenuPrimitive.Root>

          {/* Right: Theme toggle + Avatar */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-11 w-11"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full text-sm font-semibold"
                >
                  {initials}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="gap-2 opacity-50">
                  <User className="h-4 w-4" />
                  Profile
                  <span className="ml-auto text-xs text-muted-foreground">
                    (coming soon)
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="gap-2 opacity-50">
                  <KeyRound className="h-4 w-4" />
                  Password
                  <span className="ml-auto text-xs text-muted-foreground">
                    (coming soon)
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-red-600 dark:text-red-400 cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/auth/admin-signin" })}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
