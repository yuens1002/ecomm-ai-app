"use client";

import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { Table } from "@tanstack/react-table";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface DataTablePageSizeSelectorProps<TData> {
  table: Table<TData>;
}

export function DataTablePageSizeSelector<TData>({
  table,
}: DataTablePageSizeSelectorProps<TData>) {
  const pageSize = table.getState().pagination.pageSize;

  return (
    <ButtonGroup className="hidden lg:flex">
      <ButtonGroupText className="px-2.5 text-xs text-muted-foreground">
        R/P
      </ButtonGroupText>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 items-center justify-between gap-1 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 w-[72px]"
          >
            {pageSize}
            <ChevronDown className="size-4 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={String(pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              table.setPageIndex(0);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <DropdownMenuRadioItem key={size} value={String(size)}>
                {size}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
