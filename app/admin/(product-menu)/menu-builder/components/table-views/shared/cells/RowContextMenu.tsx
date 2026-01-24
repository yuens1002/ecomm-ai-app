"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Switch } from "@/components/ui/switch";
import type { SelectedEntityKind, ViewType } from "@/app/admin/(product-menu)/types/builder-state";

// Simple type for move targets (labels or categories)
type MoveTarget = { id: string; name: string };
import {
  ArrowDown,
  ArrowUp,
  Copy,
  FolderInput,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActionId =
  | "clone"
  | "visibility"
  | "remove"
  | "delete"
  | "move-up"
  | "move-down"
  | "move-to";

type ContextMenuAction = {
  id: ActionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: { mac: string; win: string };
  variant?: "default" | "destructive";
};

// ─────────────────────────────────────────────────────────────────────────────
// Action Definitions
// ─────────────────────────────────────────────────────────────────────────────

const ACTIONS: Record<ActionId, ContextMenuAction> = {
  clone: {
    id: "clone",
    label: "Clone",
    icon: Copy,
    shortcut: { mac: "⌘D", win: "Ctrl+D" },
  },
  visibility: {
    id: "visibility",
    label: "Visibility",
    icon: () => null, // Switch is rendered instead
  },
  remove: {
    id: "remove",
    label: "Remove",
    icon: X,
    shortcut: { mac: "⌫", win: "Backspace" },
  },
  delete: {
    id: "delete",
    label: "Delete",
    icon: Trash2,
    shortcut: { mac: "⌘⌫", win: "Ctrl+Backspace" },
    variant: "destructive",
  },
  "move-up": {
    id: "move-up",
    label: "Move Up",
    icon: ArrowUp,
    shortcut: { mac: "⌥↑", win: "Alt+↑" },
  },
  "move-down": {
    id: "move-down",
    label: "Move Down",
    icon: ArrowDown,
    shortcut: { mac: "⌥↓", win: "Alt+↓" },
  },
  "move-to": {
    id: "move-to",
    label: "Move to",
    icon: FolderInput,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// View + Entity → Actions Config
// ─────────────────────────────────────────────────────────────────────────────

type ViewEntityKey = `${ViewType}:${SelectedEntityKind}`;

const CONTEXT_MENU_CONFIG: Record<ViewEntityKey, ActionId[]> = {
  // Label in different views
  "menu:label": ["clone", "remove", "delete", "move-up", "move-down"],
  "all-labels:label": ["clone", "visibility", "delete", "move-up", "move-down"],
  "label:label": [], // Labels don't appear in label view
  "category:label": [], // Labels don't appear in category view
  "all-categories:label": [], // Labels don't appear in all-categories view

  // Category in different views
  "menu:category": ["clone", "visibility", "delete", "move-up", "move-down", "move-to"],
  "all-labels:category": [], // Categories don't appear in all-labels view
  "label:category": ["clone", "remove", "visibility", "delete", "move-up", "move-down", "move-to"],
  "category:category": [], // Categories don't appear in category view
  "all-categories:category": ["clone", "remove", "visibility", "delete", "move-up", "move-down", "move-to"],

  // Product in different views
  "menu:product": [], // Products don't appear in menu view
  "all-labels:product": [], // Products don't appear in all-labels view
  "label:product": [], // Products don't appear in label view
  "category:product": ["visibility", "remove", "move-up", "move-down", "move-to"],
  "all-categories:product": [], // Products don't appear in all-categories view
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Detect platform for shortcut display
// ─────────────────────────────────────────────────────────────────────────────

function useIsMac() {
  const [isMac, setIsMac] = React.useState(false);
  React.useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes("mac"));
  }, []);
  return isMac;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────────────────────────────────────

export type RowContextMenuProps = {
  children: React.ReactNode;
  entityKind: SelectedEntityKind;
  viewType: ViewType;
  entityId: string;
  isVisible: boolean;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  // Move to targets
  moveToTargets?: MoveTarget[];
  currentParentId?: string; // For filtering out current parent from move targets
  // Callbacks
  onClone?: () => void;
  onVisibilityToggle?: (isVisible: boolean) => void;
  onRemove?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveTo?: (targetId: string) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function RowContextMenu({
  children,
  entityKind,
  viewType,
  entityId,
  isVisible,
  isFirst,
  isLast,
  disabled = false,
  moveToTargets = [],
  currentParentId,
  onClone,
  onVisibilityToggle,
  onRemove,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveTo,
}: RowContextMenuProps) {
  const isMac = useIsMac();

  // Get actions for this view + entity combination
  const key: ViewEntityKey = `${viewType}:${entityKind}`;
  const actionIds = CONTEXT_MENU_CONFIG[key] ?? [];

  // If no actions, just render children without context menu
  if (actionIds.length === 0 || disabled) {
    return <>{children}</>;
  }

  // Filter move targets (exclude current parent)
  const filteredMoveTargets = moveToTargets.filter(
    (target) => target.id !== currentParentId
  );

  // Render individual action
  const renderAction = (actionId: ActionId) => {
    const action = ACTIONS[actionId];
    const Icon = action.icon;
    const shortcut = action.shortcut
      ? isMac
        ? action.shortcut.mac
        : action.shortcut.win
      : undefined;

    switch (actionId) {
      case "clone":
        return (
          <ContextMenuItem
            key={actionId}
            onClick={onClone}
            disabled={!onClone}
          >
            <Icon className="size-4" />
            {action.label}
            {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
          </ContextMenuItem>
        );

      case "visibility":
        return (
          <ContextMenuItem
            key={actionId}
            onClick={(e) => {
              e.preventDefault(); // Prevent menu from closing
              onVisibilityToggle?.(!isVisible);
            }}
            disabled={!onVisibilityToggle}
            className="justify-between"
          >
            <span>Visibility</span>
            <Switch
              checked={isVisible}
              onCheckedChange={(checked) => {
                onVisibilityToggle?.(checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="scale-75"
            />
          </ContextMenuItem>
        );

      case "remove":
        return (
          <ContextMenuItem
            key={actionId}
            onClick={onRemove}
            disabled={!onRemove}
          >
            <Icon className="size-4" />
            {action.label}
            {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
          </ContextMenuItem>
        );

      case "delete":
        return (
          <ContextMenuItem
            key={actionId}
            onClick={onDelete}
            disabled={!onDelete}
            variant="destructive"
          >
            <Icon className="size-4" />
            {action.label}
            {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
          </ContextMenuItem>
        );

      case "move-up":
        return (
          <ContextMenuItem
            key={actionId}
            onClick={onMoveUp}
            disabled={!onMoveUp || isFirst}
          >
            <Icon className="size-4" />
            {action.label}
            {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
          </ContextMenuItem>
        );

      case "move-down":
        return (
          <ContextMenuItem
            key={actionId}
            onClick={onMoveDown}
            disabled={!onMoveDown || isLast}
          >
            <Icon className="size-4" />
            {action.label}
            {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
          </ContextMenuItem>
        );

      case "move-to":
        if (filteredMoveTargets.length === 0) {
          return (
            <ContextMenuItem key={actionId} disabled>
              <Icon className="size-4" />
              {action.label}
            </ContextMenuItem>
          );
        }

        return (
          <ContextMenuSub key={actionId}>
            <ContextMenuSubTrigger>
              <Icon className="size-4" />
              {action.label}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {filteredMoveTargets.map((target) => (
                <ContextMenuItem
                  key={target.id}
                  onClick={() => onMoveTo?.(target.id)}
                >
                  {target.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        );

      default:
        return null;
    }
  };

  // Group actions: main actions, then separator, then move actions, then separator, then delete
  const mainActions = actionIds.filter(
    (id) => !["move-up", "move-down", "move-to", "delete"].includes(id)
  );
  const moveActions = actionIds.filter((id) =>
    ["move-up", "move-down", "move-to"].includes(id)
  );
  const deleteAction = actionIds.includes("delete") ? ["delete"] : [];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Main actions */}
        {mainActions.map(renderAction)}

        {/* Move actions (with separator) */}
        {moveActions.length > 0 && mainActions.length > 0 && (
          <ContextMenuSeparator />
        )}
        {moveActions.map(renderAction)}

        {/* Delete action (with separator) */}
        {deleteAction.length > 0 && (mainActions.length > 0 || moveActions.length > 0) && (
          <ContextMenuSeparator />
        )}
        {deleteAction.map((id) => renderAction(id as ActionId))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
