"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeSwitcher } from "@components/app-components/ThemeSwitcher";
import { ShoppingCart } from "@components/app-components/ShoppingCart";
import { UserMenu } from "@components/app-components/UserMenu";
import { Category } from "@/lib/types";
import { ChevronDown, Menu, Home, User, Search, Mail } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  }

  return (
    <header className="bg-white/90 dark:bg-slate-950/90 shadow-md sticky top-0 z-50 w-full backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* Logo/Title */}
        <div className="flex items-center gap-8">
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
            
            <Button asChild variant="link" className="text-text-base hover:text-primary">
              <Link href="/contact">
                Contact
              </Link>
            </Button>
          </nav>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-4">
          {/* Search Dialog */}
          <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search products</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Search Products</DialogTitle>
                <DialogDescription>
                  Search for your favorite specialty coffees
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSearch} className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Try 'Ethiopian' or 'fruity'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </form>
            </DialogContent>
          </Dialog>

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
                <div className="flex items-center justify-between mb-4">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold tracking-tight text-text-base text-left">
                      Menu
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      Navigate to different sections of the site including home
                      and coffee categories
                    </SheetDescription>
                  </SheetHeader>
                  <SheetClose asChild>
                    <Link
                      href="/search"
                      className="p-2 text-text-base hover:text-primary hover:bg-accent rounded-md transition-colors"
                    >
                      <Search className="w-5 h-5" />
                      <span className="sr-only">Search</span>
                    </Link>
                  </SheetClose>
                </div>
                <div className="flex gap-2">
                  <SheetClose asChild>
                    <Link
                      href="/"
                      className="inline-flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-lg text-text-base hover:text-primary hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Home className="w-5 h-5" />
                      <span className="text-[10px] uppercase tracking-wide font-medium">
                        Home
                      </span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/contact"
                      className="inline-flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-lg text-text-base hover:text-primary hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="text-[10px] uppercase tracking-wide font-medium">
                        Contact
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
