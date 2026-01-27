"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { adminNavConfig, isNavItemActive } from "@/lib/admin-nav-config";
import { useState } from "react";

interface AdminMobileDrawerProps {
  storeName: string;
}

export default function AdminMobileDrawer({
  storeName,
}: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-left">{storeName}</SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto py-4">
          {adminNavConfig.map((item) => {
            const isActive = isNavItemActive(item, pathname);

            return (
              <div key={item.label} className="px-2">
                {/* Section header */}
                <div
                  className={cn(
                    "px-3 py-2 text-sm font-medium text-muted-foreground",
                    isActive && "text-foreground"
                  )}
                >
                  {item.label}
                </div>

                {/* Navigation items */}
                {item.children?.map((child) => {
                  const isChildActive =
                    child.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(child.href.split("?")[0]);

                  if (child.disabled) {
                    return (
                      <div
                        key={child.href}
                        className="flex items-center justify-between px-3 py-3 pl-6 text-sm text-muted-foreground opacity-50 min-h-[44px]"
                      >
                        <span>{child.label}</span>
                        {child.disabledLabel && (
                          <span className="text-xs">
                            ({child.disabledLabel})
                          </span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-3 pl-6 text-sm rounded-md min-h-[44px] transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isChildActive &&
                          "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}

                {/* Direct link (no children) */}
                {!item.children && item.href && (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-3 pl-6 text-sm rounded-md min-h-[44px] transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
