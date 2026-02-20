"use client";

import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Table } from "@tanstack/react-table";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface DataTablePageSizeSelectorProps<TData> {
  table: Table<TData>;
}

export function DataTablePageSizeSelector<TData>({
  table,
}: DataTablePageSizeSelectorProps<TData>) {
  return (
    <ButtonGroup>
      <ButtonGroupText className="px-2.5 text-xs text-muted-foreground">
        R/P
      </ButtonGroupText>
      <Select
        value={String(table.getState().pagination.pageSize)}
        onValueChange={(value) => {
          table.setPageSize(Number(value));
          table.setPageIndex(0);
        }}
      >
        <SelectTrigger size="sm" className="w-[72px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ButtonGroup>
  );
}
