"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeSwitcher } from "@components/app-components/ThemeSwitcher";
import { ShoppingCart } from "@components/app-components/ShoppingCart";
import { UserMenu } from "@components/app-components/UserMenu";
import { Category } from "@/lib/types";
import {
  Menu,
  Home,
  User,
  Search,
  Mail,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
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
import * as React from "react";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

interface ExpandableListProps {
  items: { label: string; href: string }[];
}

function ExpandableList({ items }: ExpandableListProps) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <ListItem key={item.label} href={item.href} title={item.label} />
      ))}
    </ul>
  );
}

interface SiteHeaderProps {
  categoryGroups: Record<string, Category[]>;
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
  categoryGroups,
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
        <div className="hidden md:flex items-center space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-auto px-2 py-2 text-foreground hover:text-primary data-[state=open]:text-primary bg-transparent hover:bg-transparent focus:bg-transparent [&>svg]:hidden">
                  <div className="flex flex-col items-center gap-1">
                    <Image
                      src="/beans.svg"
                      alt="Coffee selections"
                      width={20}
                      height={20}
                      className="w-5 h-5 dark:invert"
                    />
                    <div className="flex items-center gap-1">
                      {/* Spacer to balance the chevron for centering */}
                      <div className="w-3 h-3" aria-hidden="true" />
                      <span className="text-[10px] uppercase tracking-wide font-medium leading-3">
                        Coffee
                      </span>
                      <ChevronDown
                        className="h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[600px] p-6 h-[330px] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-8">
                      {/* Dynamically render columns for each category group */}
                      {Object.entries(categoryGroups).map(
                        ([label, categories]) => (
                          <div key={label} className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2 px-2">
                              {label}
                            </h4>
                            <ExpandableList
                              items={categories.map((cat) => ({
                                label: cat.name,
                                href: `/${cat.slug}`,
                              }))}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/about"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "h-auto flex-col gap-1 px-2 py-2 text-foreground hover:text-primary bg-transparent hover:bg-transparent focus:bg-transparent"
                    )}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-wide font-medium leading-3">
                      About
                    </span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/contact"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "h-auto flex-col gap-1 px-2 py-2 text-foreground hover:text-primary bg-transparent hover:bg-transparent focus:bg-transparent"
                    )}
                  >
                    <Mail className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-wide font-medium leading-3">
                      Contact
                    </span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

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
                    <SheetTitle className="text-2xl font-bold tracking-tight text-foreground text-left">
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
                      className="inline-flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-lg text-foreground hover:text-primary hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                      className="inline-flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-lg text-foreground hover:text-primary hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                      className="inline-flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-lg text-foreground hover:text-primary hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                      className="inline-flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-lg text-foreground hover:text-primary hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                {Object.entries(categoryGroups).map(([label, categories]) => (
                  <div key={label} className="mb-6">
                    <div className="flex items-center gap-2 mb-2 px-4">
                      <Image
                        src="/beans.svg"
                        alt="Coffee"
                        width={20}
                        height={20}
                        className="w-5 h-5 dark:invert"
                      />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                        {label}
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
                              <Link href={`/${category.slug}`}>
                                {category.name}
                              </Link>
                            </Button>
                          </SheetClose>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
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
