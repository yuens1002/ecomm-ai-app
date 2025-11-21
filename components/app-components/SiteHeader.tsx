"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeSwitcher } from "@components/app-components/ThemeSwitcher";
import { ShoppingCart } from "@components/app-components/ShoppingCart";
import { UserMenu } from "@components/app-components/UserMenu";
import { Category } from "@/lib/types";
import { Menu, Home, User, Search, Mail, FileText } from "lucide-react";
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
  origins: string[];
  roastLevels: string[];
  specialCategories: string[];
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
  origins,
  roastLevels,
  specialCategories,
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
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center gap-6 md:gap-12">
        {/* Logo/Title */}
        <Link href="/" className="flex items-center gap-2 text-primary">
          {/* Mobile View: Stacked */}
          <div className="flex flex-col items-center lg:hidden">
            <Image
              src="/logo.svg"
              alt="Artisan Roast Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-[10px] uppercase tracking-wide font-medium leading-none mt-1">
              Artisan Roast
            </span>
          </div>

          {/* Desktop View: Side by Side */}
          <div className="hidden lg:flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Artisan Roast Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-2xl font-bold">Artisan Roast</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {/* UPDATED: Mega Menu for Coffee Categories */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto flex-col gap-1 px-2 py-2 text-text-base hover:text-primary data-[state=open]:text-primary"
              >
                <Image
                  src="/beans.svg"
                  alt="Coffee selections"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
                <span className="text-[10px] uppercase tracking-wide font-medium">
                  Coffee
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[600px] p-6">
              <div className="grid grid-cols-3 gap-8">
                {/* Roast Level Column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
                    Roast Level
                  </h4>
                  <ul className="space-y-2">
                    {roastLevels.map((roast) => (
                      <li key={roast}>
                        <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                          <Link
                            href={`/search?roast=${roast.toLowerCase()}`}
                            className="text-sm hover:text-primary transition-colors block py-1 cursor-pointer"
                          >
                            {roast.charAt(0) + roast.slice(1).toLowerCase()} Roast
                          </Link>
                        </DropdownMenuItem>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Origins Column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
                    Origins
                  </h4>
                  <ul className="space-y-2">
                    {origins.map((origin) => (
                      <li key={origin}>
                        <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                          <Link
                            href={`/search?origin=${encodeURIComponent(origin)}`}
                            className="text-sm hover:text-primary transition-colors block py-1 cursor-pointer"
                          >
                            {origin}
                          </Link>
                        </DropdownMenuItem>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Collections Column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
                    Collections
                  </h4>
                  <ul className="space-y-2">
                    {specialCategories.map((special) => (
                      <li key={special}>
                        <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                          <Link
                            href={
                              special === "Blends"
                                ? "/search?origin=Blend"
                                : `/search?q=${encodeURIComponent(special)}`
                            }
                            className="text-sm hover:text-primary transition-colors block py-1 cursor-pointer"
                          >
                            {special}
                          </Link>
                        </DropdownMenuItem>
                      </li>
                    ))}
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                          <Link
                            href={`/categories/${category.slug}`}
                            className="text-sm hover:text-primary transition-colors block py-1 cursor-pointer"
                          >
                            {category.name}
                          </Link>
                        </DropdownMenuItem>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            asChild
            variant="ghost"
            className="h-auto flex-col gap-1 px-2 py-2 text-text-base hover:text-primary"
          >
            <Link href="/about">
              <FileText className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-wide font-medium">
                About
              </span>
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="h-auto flex-col gap-1 px-2 py-2 text-text-base hover:text-primary"
          >
            <Link href="/contact">
              <Mail className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-wide font-medium">
                Contact
              </span>
            </Link>
          </Button>
        </nav>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-4 ml-auto">
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
                <User className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Sign In</span>
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
                </div>
                <div className="flex gap-2 justify-center w-full">
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
                      href="/search"
                      className="inline-flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-lg text-text-base hover:text-primary hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Search className="w-5 h-5" />
                      <span className="text-[10px] uppercase tracking-wide font-medium">
                        Search
                      </span>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/about"
                      className="inline-flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-lg text-text-base hover:text-primary hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-[10px] uppercase tracking-wide font-medium">
                        About
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
                  <div className="flex items-center gap-2 mb-2 px-4">
                    <Image
                      src="/beans.svg"
                      alt="Coffee"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                      Coffee
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            asChild
                            className="w-full justify-start font-normal"
                          >
                            <Link href={`/categories/${category.slug}`}>
                              {category.name}
                            </Link>
                          </Button>
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
