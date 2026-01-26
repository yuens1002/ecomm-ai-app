"use client";

import { ChevronDown } from "lucide-react";
import { DynamicIcon } from "@/components/app-components/DynamicIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItemProps {
  icon?: string; // DynamicIcon name (e.g., "Home", "Tags")
  text?: string; // Display text
  isSelected: boolean; // Highlights segment (primary background)
  hasDropdown: boolean; // Shows chevron and enables dropdown
  onClick?: () => void; // Click handler for non-dropdown items
  children?: React.ReactNode; // DropdownMenu content
}

/**
 * NavItem - Generic navigation segment for MenuNavBar
 *
 * Displays icon + text with optional dropdown.
 * Shows selected state with primary background.
 * Responsive: icon-only on mobile, icon + text on md+
 */
export function NavItem({
  icon,
  text,
  isSelected,
  hasDropdown,
  onClick,
  children,
}: NavItemProps) {
  const content = (
    <Button
      variant={isSelected ? "default" : "ghost"}
      size="sm"
      className={cn(
        "flex items-center gap-2",
        !hasDropdown && "cursor-pointer"
      )}
      onClick={!hasDropdown ? onClick : undefined}
    >
      {icon && <DynamicIcon name={icon} className="w-4 h-4" size={16} />}
      <span className="hidden md:inline">{text}</span>
      {hasDropdown && <ChevronDown className="w-4 h-4 ml-1" />}
    </Button>
  );

  if (hasDropdown && children) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{content}</DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[200px] max-h-[200px] overflow-y-auto"
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            // Stop the click from propagating to underlying elements
            e.detail.originalEvent.stopPropagation();
          }}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return content;
}
