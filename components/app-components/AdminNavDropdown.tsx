"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NavItem, isNavItemActive } from "@/lib/admin-nav-config";

interface AdminNavDropdownProps {
  item: NavItem;
}

export default function AdminNavDropdown({ item }: AdminNavDropdownProps) {
  const pathname = usePathname();
  const isActive = isNavItemActive(item, pathname);
  const Icon = item.icon;

  // If no children, render as direct link
  if (!item.children && item.href) {
    return (
      <Button
        variant="ghost"
        asChild
        className={cn(
          "gap-2 text-sm font-medium",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <Link href={item.href}>
          <Icon className="h-4 w-4" />
          {item.label}
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "gap-1 text-sm font-medium",
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {item.label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {item.children?.map((child) => {
          const ChildIcon = child.icon;
          const isChildActive =
            child.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(child.href.split("?")[0]);

          if (child.disabled) {
            return (
              <DropdownMenuItem
                key={child.href}
                disabled
                className="gap-2 opacity-50"
              >
                {ChildIcon && <ChildIcon className="h-4 w-4" />}
                <span>{child.label}</span>
                {child.disabledLabel && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    ({child.disabledLabel})
                  </span>
                )}
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem key={child.href} asChild>
              <Link
                href={child.href}
                className={cn("gap-2", isChildActive && "bg-accent")}
              >
                {ChildIcon && <ChildIcon className="h-4 w-4" />}
                {child.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
