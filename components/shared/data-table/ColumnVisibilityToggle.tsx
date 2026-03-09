"use client";

import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TogglableColumn {
  id: string;
  label: string;
}

interface ColumnVisibilityToggleProps {
  columns: TogglableColumn[];
  columnVisibility: Record<string, boolean>;
  onVisibilityChange: (columnId: string, visible: boolean) => void;
}

export function ColumnVisibilityToggle({
  columns,
  columnVisibility,
  onVisibilityChange,
}: ColumnVisibilityToggleProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <Columns3 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {columns.map((col) => (
            <Label
              key={col.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm font-normal"
            >
              <Checkbox
                checked={columnVisibility[col.id] !== false}
                onCheckedChange={(checked) =>
                  onVisibilityChange(col.id, !!checked)
                }
              />
              {col.label}
            </Label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
