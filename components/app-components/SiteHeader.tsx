"use client";

import Link from "next/link";
import { ThemeSwitcher } from "@components/app-components/ThemeSwitcher";
import { ShoppingCart } from "@components/app-components/ShoppingCart";
import { UserMenu } from "@components/app-components/UserMenu";
import { Category } from "@/lib/types";
import { ChevronDown, Menu, Home, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  categories: Category[];
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  isAdmin: boolean;
}

/**
 * The site-wide header. This is a Client Component because
 * it uses the ThemeSwitcher, which is a Client Component.
 */
export default function SiteHeader({
  categories,
  user,
  isAdmin,
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
          <ShoppingCart />
          {user ? (
            <UserMenu user={user} isAdmin={isAdmin} />
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/signin">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
          {/* --- MOBILE MENU IMPLEMENTATION --- */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="outline"
                size="icon"
                className="focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Menu className="w-6 h-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] sm:w-[320px] bg-background p-0 flex flex-col"
            >
              <div className="px-6 pt-6 pb-4">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold tracking-tight text-text-base text-left">
                    Menu
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigate to different sections of the site including home
                    and coffee categories
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <SheetClose asChild>
                    <Link
                      href="/"
                      className="inline-flex flex-col items-center justify-center gap-1 w-12 rounded-lg text-text-base hover:text-primary hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary py-2"
                    >
                      <Home className="w-5 h-5" />
                      <span className="text-[10px] uppercase tracking-wide font-medium">
                        Home
                      </span>
                    </Link>
                  </SheetClose>
                </div>
              </div>
              <nav
                aria-label="Mobile"
                className="flex-1 overflow-y-auto px-6 py-4 border-t border-border"
              >
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
                    Coffees
                  </h3>
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <SheetClose asChild>
                          <Link
                            href={`/categories/${category.slug}`}
                            className="block text-base text-text-base hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 py-1"
                          >
                            {category.name}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
              <div className="px-6 pb-6 mt-auto">
                <SheetClose asChild>
                  <Button className="w-full" variant="secondary">
                    Close
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
          {/* --- END MOBILE MENU --- */}
        </div>
      </div>

      {/* Mobile Navigation (to be implemented) */}
      {/* <div className="md:hidden"> ... </div> */}
    </header>
  );
}
