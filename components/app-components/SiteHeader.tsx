"use client";

import Link from "next/link";
import { ThemeSwitcher } from "@components/app-components/ThemeSwitcher";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The site-wide header. It's a Client Component because it
 * contains the ThemeSwitcher, which uses client-side hooks.
 */
export default function SiteHeader() {
  // Mock cart item count for now
  const cartItemCount = 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center mx-auto px-4 md:px-8">
        {/* Logo / Site Title */}
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">
              Artisan Roast
            </span>
          </Link>
        </div>

        {/* Main Navigation (WIP) */}
        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link
            href="/products"
            className="text-text-muted transition-colors hover:text-primary"
          >
            All Coffee
          </Link>
          <Link
            href="/about"
            className="text-text-muted transition-colors hover:text-primary"
          >
            About
          </Link>
        </nav>

        {/* Right-side Icons */}
        <div className="flex items-center justify-end space-x-4">
          <Button variant="ghost" size="icon" aria-label="Open cart">
            <ShoppingCart className="h-5 w-5 text-text-muted" />
            {cartItemCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Button>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
