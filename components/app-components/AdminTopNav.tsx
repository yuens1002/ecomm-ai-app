"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { adminNavConfig, isNavItemActive, NavItem } from "@/lib/admin-nav-config";
import AdminMobileDrawer from "./AdminMobileDrawer";

interface AdminTopNavProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  storeName: string;
  storeLogoUrl: string;
}

function NavDropdown({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = isNavItemActive(item, pathname);
  const Icon = item.icon;

  return (
    <NavigationMenuPrimitive.Item className="relative">
      <NavigationMenuPrimitive.Trigger
        className={cn(
          "group inline-flex h-auto items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
          "data-[state=open]:bg-accent",
          isActive && "text-primary"
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
            const isChildActive =
              child.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(child.href.split("?")[0]);

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

export default function AdminTopNav({
  user,
  storeName,
  storeLogoUrl,
}: AdminTopNavProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

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
        <div className="flex h-16 items-center justify-between">
          {/* Left: Mobile drawer + Back arrow + Logo/Brand */}
          <div className="flex items-center">
            {/* Mobile menu drawer (shown on mobile/tablet) */}
            <AdminMobileDrawer storeName={storeName} />

            {/* Back to public site - negative margin so arrow aligns with content edge */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-11 w-11 -ml-2.5"
              title="Open public site"
            >
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Open public site</span>
              </Link>
            </Button>

            {/* Logo OR Store Name (not both) */}
            <div className="flex items-center ml-1">
              {storeLogoUrl ? (
                <Image
                  src={storeLogoUrl}
                  alt={storeName}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <span className="font-semibold text-lg hidden sm:inline">
                  {storeName}
                </span>
              )}
            </div>
          </div>

          {/* Center: Navigation menu (hidden on mobile) */}
          <NavigationMenuPrimitive.Root className="hidden lg:flex">
            <NavigationMenuPrimitive.List className="flex items-center gap-1">
              {adminNavConfig.map((item) => (
                <NavDropdown key={item.label} item={item} pathname={pathname} />
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
