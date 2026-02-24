"use client";

import { MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RecordAction } from "./MobileRecordCard";

interface RecordActionMenuProps {
  actions: RecordAction[];
  loading?: boolean;
  align?: "start" | "center" | "end";
}

export function RecordActionMenu({
  actions,
  loading,
  align = "end",
}: RecordActionMenuProps) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {actions.map((action) =>
          action.subItems && action.subItems.length > 0 ? (
            <DropdownMenuSub key={action.label}>
              <DropdownMenuSubTrigger>
                {action.icon}
                {action.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {action.subItems.map((sub) => (
                  <DropdownMenuItem key={sub.label} onClick={sub.onClick}>
                    {sub.icon}
                    {sub.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              className={
                action.className ||
                (action.variant === "destructive" ? "text-red-600" : "")
              }
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
