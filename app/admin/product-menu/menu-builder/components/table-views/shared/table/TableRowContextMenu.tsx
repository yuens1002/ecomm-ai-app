"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import * as React from "react";

type ContextMenuAction = {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  disabled?: boolean;
  variant?: "default" | "destructive";
  onClick: () => void;
};

type TableRowContextMenuProps = {
  children: React.ReactNode;
  /** Row index (0-based) for determining move up/down availability */
  rowIndex: number;
  /** Total number of rows in the table */
  totalRows: number;
  /** Handler for moving row up */
  onMoveUp?: () => void;
  /** Handler for moving row down */
  onMoveDown?: () => void;
  /** Additional actions from action bar config */
  actions?: ContextMenuAction[];
  /** Whether this row can be reordered */
  canReorder?: boolean;
  /** Disable the context menu entirely */
  disabled?: boolean;
};

/**
 * Context menu wrapper for table rows.
 *
 * Provides:
 * - Move Up / Move Down actions for reordering (mobile DnD alternative)
 * - Additional view-specific actions from action bar
 *
 * Works on both desktop (right-click) and mobile (long-press).
 * shadcn/Radix handles the gesture detection automatically.
 */
export function TableRowContextMenu({
  children,
  rowIndex,
  totalRows,
  onMoveUp,
  onMoveDown,
  actions = [],
  canReorder = true,
  disabled = false,
}: TableRowContextMenuProps) {
  const isFirstRow = rowIndex === 0;
  const isLastRow = rowIndex === totalRows - 1;

  // If disabled, just render children without context menu
  if (disabled) {
    return <>{children}</>;
  }

  const hasReorderActions = canReorder && (onMoveUp || onMoveDown);
  const hasAdditionalActions = actions.length > 0;

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {/* Move Up / Move Down for reordering */}
        {hasReorderActions && (
          <>
            {onMoveUp && (
              <ContextMenuItem
                onClick={onMoveUp}
                disabled={isFirstRow}
              >
                <ChevronUp className="mr-2 h-4 w-4" />
                Move Up
              </ContextMenuItem>
            )}
            {onMoveDown && (
              <ContextMenuItem
                onClick={onMoveDown}
                disabled={isLastRow}
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                Move Down
              </ContextMenuItem>
            )}
            {hasAdditionalActions && <ContextMenuSeparator />}
          </>
        )}

        {/* Additional view-specific actions */}
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isDestructive = action.variant === "destructive";

          // Add separator before destructive actions
          const needsSeparator =
            isDestructive &&
            index > 0 &&
            actions[index - 1]?.variant !== "destructive";

          return (
            <React.Fragment key={action.id}>
              {needsSeparator && <ContextMenuSeparator />}
              <ContextMenuItem
                onClick={action.onClick}
                disabled={action.disabled}
                variant={action.variant}
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
                {action.shortcut && (
                  <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>
                )}
              </ContextMenuItem>
            </React.Fragment>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}

/**
 * Helper to build common context menu actions.
 */
export const contextMenuActions = {
  clone: (onClick: () => void, disabled = false): ContextMenuAction => ({
    id: "clone",
    label: "Clone",
    icon: Copy,
    shortcut: "D",
    disabled,
    onClick,
  }),

  toggleVisibility: (
    onClick: () => void,
    isCurrentlyVisible: boolean,
    disabled = false
  ): ContextMenuAction => ({
    id: "visibility",
    label: isCurrentlyVisible ? "Hide" : "Show",
    icon: isCurrentlyVisible ? EyeOff : Eye,
    shortcut: "V",
    disabled,
    onClick,
  }),

  delete: (onClick: () => void, disabled = false): ContextMenuAction => ({
    id: "delete",
    label: "Delete",
    icon: Trash2,
    shortcut: "X",
    disabled,
    variant: "destructive",
    onClick,
  }),
};
