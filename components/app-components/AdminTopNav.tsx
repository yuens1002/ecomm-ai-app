"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Moon, Sun, LogOut, User, KeyRound } from "lucide-react";
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
import { adminNavConfig } from "@/lib/admin-nav-config";
import AdminNavDropdown from "./AdminNavDropdown";
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

            {/* Logo or Store Name */}
            <div className="flex items-center gap-2">
              {storeLogoUrl ? (
                <Image
                  src={storeLogoUrl}
                  alt={storeName}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              ) : null}
              <span className="font-semibold text-lg hidden sm:inline">
                {storeName}
              </span>
            </div>
          </div>

          {/* Center: Navigation dropdowns (hidden on mobile) */}
          <nav className="hidden lg:flex items-center gap-1">
            {adminNavConfig.map((item) => (
              <AdminNavDropdown key={item.label} item={item} />
            ))}
          </nav>

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
                  variant="ghost"
                  className="relative h-11 w-11 rounded-full"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
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
