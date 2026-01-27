"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Moon, Sun, LogOut, User, KeyRound } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { adminNavConfig, isNavItemActive } from "@/lib/admin-nav-config";
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

export default function AdminTopNav({
  user,
  storeName,
  storeLogoUrl,
}: AdminTopNavProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu drawer (shown on mobile/tablet) */}
            <AdminMobileDrawer storeName={storeName} />

            {/* Back to public site */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-11 w-11"
              title="Open public site"
            >
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Open public site</span>
              </Link>
            </Button>

            {/* Logo OR Store Name (not both) */}
            <div className="flex items-center">
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
          {isClient && (
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {adminNavConfig.map((item) => {
                  const isActive = isNavItemActive(item, pathname);
                  const Icon = item.icon;

                  return (
                    <NavigationMenuItem key={item.label}>
                      <NavigationMenuTrigger
                        className={cn(
                          "h-auto px-3 py-2 bg-transparent hover:bg-accent focus:bg-accent data-[state=open]:bg-accent",
                          "[&>svg:last-child]:ml-1 [&>svg:last-child]:transition-transform [&>svg:last-child]:duration-200 [&[data-state=open]>svg:last-child]:rotate-180",
                          isActive && "text-primary"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-1.5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="w-48 p-2">
                          {item.children?.map((child) => {
                            const isChildActive =
                              child.href === "/admin"
                                ? pathname === "/admin"
                                : pathname.startsWith(child.href.split("?")[0]);

                            if (child.disabled) {
                              return (
                                <li key={child.href}>
                                  <span className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                                    {child.label}
                                    {child.disabledLabel && (
                                      <span className="text-xs">
                                        ({child.disabledLabel})
                                      </span>
                                    )}
                                  </span>
                                </li>
                              );
                            }

                            return (
                              <li key={child.href}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={child.href}
                                    className={cn(
                                      "block px-3 py-2 text-sm rounded-md transition-colors",
                                      "hover:bg-accent hover:text-accent-foreground",
                                      isChildActive && "bg-accent text-accent-foreground font-medium"
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            );
                          })}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          )}

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
                  className="h-11 w-11 rounded-full"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    {initials}
                  </div>
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
