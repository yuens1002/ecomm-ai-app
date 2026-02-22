"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavigableChildren } from "@/lib/navigation";
import {
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminBreadcrumbDropdownProps {
  item: { id: string; label: string; href: string | null };
  isLast: boolean;
  /** Skip the leading separator (previous item rendered an animated trailing one) */
  skipSeparator?: boolean;
}

const linkStyles = "underline-offset-4 hover:underline";

/**
 * Renders a breadcrumb item, optionally with a leading separator.
 * When the item has navigable children, the label becomes a dropdown trigger
 * and an animated separator chevron is rendered AFTER the label.
 */
export function AdminBreadcrumbDropdown({
  item,
  isLast,
  skipSeparator = false,
}: AdminBreadcrumbDropdownProps) {
  const [open, setOpen] = useState(false);

  const children = isLast ? [] : getNavigableChildren(item.id);

  // No children — plain text/link
  if (children.length === 0) {
    return (
      <>
        {!skipSeparator && <BreadcrumbSeparator />}
        <BreadcrumbItem>
          {isLast || !item.href ? (
            <span>{item.label}</span>
          ) : (
            <Link href={item.href} className={linkStyles}>
              {item.label}
            </Link>
          )}
        </BreadcrumbItem>
      </>
    );
  }

  // Has children — label is dropdown trigger, trailing > animates
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {!skipSeparator && <BreadcrumbSeparator />}
      <BreadcrumbItem>
        <DropdownMenuTrigger
          className={cn(
            linkStyles,
            "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
          )}
        >
          {item.label}
        </DropdownMenuTrigger>
      </BreadcrumbItem>
      <BreadcrumbSeparator>
        <ChevronRight
          className={cn(
            "size-3.5 transition-[rotate] duration-200",
            open && "-rotate-90"
          )}
        />
      </BreadcrumbSeparator>
      <DropdownMenuContent
        align="start"
        className="max-h-72 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_[data-slot=dropdown-menu-item]]:cursor-pointer"
      >
        {item.href && (
          <>
            <DropdownMenuItem asChild>
              <Link href={item.href} className="font-semibold">
                {item.label}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {children.map((child) => (
          <DropdownMenuItem key={child.href} asChild>
            <Link href={child.href}>{child.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Check if a route ID has navigable children (used by parent to determine
 * whether the next item should skip its leading separator).
 */
export function hasNavigableChildren(routeId: string, isLast: boolean): boolean {
  if (isLast) return false;
  return getNavigableChildren(routeId).length > 0;
}
