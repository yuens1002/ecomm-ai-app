"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import { DynamicIcon } from "@/components/shared/icons/DynamicIcon";
import { cn } from "@/lib/utils";

interface TreeRowProps {
  level: 0 | 1 | 2 | 3; // menu, label, category, product
  icon?: string | null;
  name: string;
  isExpanded?: boolean;
  isSelected?: boolean;
  canExpand?: boolean;
  showCheckbox?: boolean;
  onToggleExpand?: () => void;
  onToggleSelect?: () => void;
  onRowClick?: () => void;
  actions?: React.ReactNode;
  rowProps?: React.HTMLAttributes<HTMLTableRowElement>;
  children?: React.ReactNode;
}

export function TreeRow({
  level,
  icon,
  name,
  isExpanded = false,
  isSelected = false,
  canExpand = false,
  showCheckbox = false,
  onToggleExpand,
  onToggleSelect,
  onRowClick,
  actions,
  rowProps,
  children,
}: TreeRowProps) {
  const indentPx = level * 16; // 16px per level

  return (
    <>
      <tr
        className={cn(
          "h-10 hover:bg-muted/40 cursor-pointer",
          isSelected && "bg-primary/10",
          rowProps?.className
        )}
        {...rowProps}
        onClick={(e) => {
          rowProps?.onClick?.(e);
          onRowClick?.();
        }}
      >
        {/* Checkbox column */}
        <td className="w-6 text-center align-middle px-2">
          {showCheckbox ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-4 h-4 cursor-pointer accent-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}
        </td>

        {/* Content column: indent + chevron + icon + name */}
        <td className="align-middle px-2">
          <div className="flex items-center">
            <span className="shrink-0" style={{ width: indentPx }} />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
              className={cn(
                "w-4 h-4 mr-2 flex items-center justify-center text-muted-foreground hover:text-foreground",
                !canExpand && "invisible"
              )}
            >
              {canExpand &&
                (isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                ))}
            </button>

            {icon ? (
              <DynamicIcon
                name={icon as string}
                size={16}
                className="mr-2 text-muted-foreground shrink-0"
              />
            ) : level === 3 ? (
              <DynamicIcon
                name={"Package" as string}
                size={16}
                className="mr-2 text-muted-foreground shrink-0"
              />
            ) : (
              <span className="w-4 h-4 mr-2 shrink-0" />
            )}

            <span className="truncate text-sm font-medium text-muted-foreground">
              {name}
            </span>
          </div>
        </td>

        {/* Actions column */}
        <td className="w-8 text-center align-middle px-2">{actions}</td>
      </tr>

      {/* Children (when expanded) */}
      {isExpanded && children}
    </>
  );
}
