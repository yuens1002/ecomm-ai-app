"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";

interface RowActionSubMenuItem {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export type RowActionItem =
  | {
      type: "item";
      label: string;
      icon?: LucideIcon;
      onClick?: () => void;
      variant?: "default" | "destructive";
    }
  | {
      type: "sub-menu";
      label: string;
      icon?: LucideIcon;
      items: RowActionSubMenuItem[];
    }
  | { type: "separator" };

interface RowActionMenuProps {
  items: RowActionItem[];
}

export function RowActionMenu({ items }: RowActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-100 md:opacity-0 md:group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity data-[state=open]:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Row actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, i) => {
          if (item.type === "separator") {
            return <DropdownMenuSeparator key={i} />;
          }
          if (item.type === "sub-menu") {
            const Icon = item.icon;
            return (
              <DropdownMenuSub key={i}>
                <DropdownMenuSubTrigger>
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {item.items.map((sub) => (
                    <DropdownMenuCheckboxItem
                      key={sub.label}
                      checked={sub.checked}
                      onCheckedChange={sub.onCheckedChange}
                    >
                      {sub.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          }
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={i}
              variant={item.variant}
              onClick={item.onClick}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
