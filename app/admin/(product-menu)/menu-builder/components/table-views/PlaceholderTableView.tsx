"use client";

import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";

export function PlaceholderTableView() {
  const { builder } = useMenuBuilder();

  return (
    <TableViewWrapper>
      <TableBody>
        <TableRow>
          <TableCell colSpan={999} className="py-10">
            <div className="text-center text-muted-foreground">
              <p className="font-semibold">Current view: {builder.currentView}</p>
              <div className="mt-2 space-y-1">
                {builder.currentLabelId ? (
                  <p className="text-xs">Label ID: {builder.currentLabelId}</p>
                ) : null}
                {builder.currentCategoryId ? (
                  <p className="text-xs">Category ID: {builder.currentCategoryId}</p>
                ) : null}
                <p className="text-xs">Selected: {builder.selectedIds.length} items</p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </TableViewWrapper>
  );
}
