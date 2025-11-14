"use client";

import Link from "next/link";
import { ThemeSwitcher } from "@components/app-components/ThemeSwitcher";
import { Category } from "@/lib/types";
import { ShoppingCart, ChevronDown } from "lucide-react"; // Use lucide for cart icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  categories: Category[];
  cartItemCount?: number; // Make cart count optional for now
}

/**
 * The site-wide header. This is a Client Component because
 * it uses the ThemeSwitcher, which is a Client Component.
 */
export default function SiteHeader({
  categories,
  cartItemCount = 0,
}: SiteHeaderProps) {
  return (
    <header className="bg-white/90 dark:bg-slate-950/90 shadow-md sticky top-0 z-50 w-full backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* Logo/Title */}
        <Link href="/" className="text-2xl font-bold text-primary">
          Artisan Roast
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {/* UPDATED: Category links now point to /categories/[slug] */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-text-base hover:text-primary data-[state=open]:text-primary"
              >
                Coffees
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {categories.map((category) => (
                <DropdownMenuItem key={category.slug} asChild>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-text-base"
                  >
                    {category.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* We can add other static links here */}
          {/* <Link 
            href="/about" 
            className="text-text-base hover:text-primary transition-colors"
          >
            About
          </Link>
          */}
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          <button
            className="relative text-text-muted hover:text-primary transition-colors"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
          {/* Add a Mobile Menu button here */}
        </div>
      </div>

      {/* Mobile Navigation (to be implemented) */}
      {/* <div className="md:hidden"> ... </div> */}
    </header>
  );
}
