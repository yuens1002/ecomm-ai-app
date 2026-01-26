"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Kbd } from "@/components/ui/kbd";
import type { SelectedEntityKind, ViewType } from "@/app/admin/(product-menu)/types/builder-state";
import { ACTIONS as ACTION_BAR_ACTIONS } from "@/app/admin/(product-menu)/constants/action-bar/actions";
import { CheckboxListContent } from "@/app/admin/(product-menu)/menu-builder/components/shared/CheckboxListContent";

// Simple type for move targets (labels or categories)
type MoveTarget = { id: string; name: string };
// Type for category targets (for add/remove categories action)
type CategoryTarget = { id: string; name: string };
// Type for label targets (for add/remove labels action)
type LabelTarget = { id: string; name: string };
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
  CornerUpLeft,
  Eye,
  FileSpreadsheet,
  FolderInput,
  Tags,
  Trash2,
} from "lucide-react";
import * as React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ContextMenuActionId =
  | "clone"
  | "visibility"
  | "remove"
  | "delete"
  | "move-up"
  | "move-down"
  | "move-to"
  | "manage-categories"
  | "manage-labels";

type ContextMenuAction = {
  id: ContextMenuActionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  kbd?: string[]; // Reference to kbd array from action-bar actions
  variant?: "default" | "destructive";
  /** Whether this action supports bulk operations */
  supportsBulk?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Action Definitions - Using kbd from action-bar actions where available
// ─────────────────────────────────────────────────────────────────────────────

const CONTEXT_MENU_ACTIONS: Record<ContextMenuActionId, ContextMenuAction> = {
  clone: {
    id: "clone",
    label: "Clone",
    icon: Copy,
    kbd: ACTION_BAR_ACTIONS.clone.kbd,
    supportsBulk: true,
  },
  visibility: {
    id: "visibility",
    label: "Visibility",
    icon: Eye,
    kbd: ACTION_BAR_ACTIONS.visibility.kbd,
    supportsBulk: true,
  },
  remove: {
    id: "remove",
    label: "Remove",
    icon: CornerUpLeft,
    kbd: ACTION_BAR_ACTIONS.remove.kbd,
    supportsBulk: true,
  },
  delete: {
    id: "delete",
    label: "Delete",
    icon: Trash2,
    kbd: ACTION_BAR_ACTIONS.delete.kbd,
    variant: "destructive",
    supportsBulk: true,
  },
  "move-up": {
    id: "move-up",
    label: "Move Up",
    icon: ArrowUp,
    kbd: ["K"], // Vim-style: K = up
    supportsBulk: false, // Single item only
  },
  "move-down": {
    id: "move-down",
    label: "Move Down",
    icon: ArrowDown,
    kbd: ["J"], // Vim-style: J = down
    supportsBulk: false, // Single item only
  },
  "move-to": {
    id: "move-to",
    label: "Move To",
    icon: FolderInput,
    supportsBulk: false, // Single item only
  },
  "manage-categories": {
    id: "manage-categories",
    label: "Categories",
    icon: FileSpreadsheet,
    supportsBulk: false, // Single item only - submenu with multi-select
  },
  "manage-labels": {
    id: "manage-labels",
    label: "Labels",
    icon: Tags,
    supportsBulk: false, // Single item only - submenu with multi-select
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Format kbd array to display string
// ─────────────────────────────────────────────────────────────────────────────

function formatKbd(kbd: string[] | undefined, isMac: boolean): string | undefined {
  if (!kbd || kbd.length === 0) return undefined;

  // Map modifiers to platform-specific symbols
  return kbd
    .map((key) => {
      // Handle modKey placeholder (already resolved to ⌘ or Ctrl in shared.ts)
      if (key === "⌘" && !isMac) return "Ctrl";
      if (key === "Ctrl" && isMac) return "⌘";
      // Handle Alt/Option
      if (key === "Alt") return isMac ? "⌥" : "Alt";
      if (key === "⌥" && !isMac) return "Alt";
      // Handle Shift
      if (key === "Shift") return isMac ? "⇧" : "Shift";
      return key;
    })
    .join(isMac ? "" : "+");
}

// ─────────────────────────────────────────────────────────────────────────────
// View + Entity → Actions Config
// ─────────────────────────────────────────────────────────────────────────────

type ViewEntityKey = `${ViewType}:${SelectedEntityKind}`;

const CONTEXT_MENU_CONFIG: Record<ViewEntityKey, ContextMenuActionId[]> = {
  // Action bar order: manage-* → clone → remove → visibility → move-* → delete

  // Label in different views
  "menu:label": ["clone", "remove", "move-up", "move-down", "delete"],
  "all-labels:label": ["manage-categories", "clone", "visibility", "move-up", "move-down", "delete"],
  "label:label": [], // Labels don't appear in label view
  "category:label": [], // Labels don't appear in category view
  "all-categories:label": [], // Labels don't appear in all-categories view

  // Category in different views (no delete in menu/label views)
  "menu:category": ["clone", "visibility", "move-up", "move-down", "move-to"],
  "all-labels:category": [], // Categories don't appear in all-labels view
  "label:category": ["clone", "remove", "visibility", "move-up", "move-down", "move-to"],
  "category:category": [], // Categories don't appear in category view
  "all-categories:category": ["manage-labels", "clone", "visibility", "delete"],

  // Product in different views (no move-to, no delete)
  "menu:product": [], // Products don't appear in menu view
  "all-labels:product": [], // Products don't appear in all-labels view
  "label:product": [], // Products don't appear in label view
  "category:product": ["manage-categories", "remove", "move-up", "move-down"],
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
  // Bulk mode context
  /** Number of items currently selected */
  selectedCount?: number;
  /** Whether the right-clicked item is part of the selection */
  isInSelection?: boolean;
  /** Whether the selection contains mixed entity types */
  isMixedSelection?: boolean;
  // Move to targets
  moveToTargets?: MoveTarget[];
  currentParentId?: string; // For filtering out current parent from move targets
  // Category management (for labels)
  categoryTargets?: CategoryTarget[];
  attachedCategoryIds?: string[];
  // Label management (for categories)
  labelTargets?: LabelTarget[];
  attachedLabelIds?: string[];
  // Context menu state callback (for highlighting the row)
  onOpenChange?: (open: boolean) => void;
  // Callbacks
  onClone?: () => void;
  onVisibilityToggle?: (isVisible: boolean) => void;
  onRemove?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveTo?: (targetId: string) => void;
  onCategoryToggle?: (categoryId: string, isAttached: boolean) => void;
  onLabelToggle?: (labelId: string, isAttached: boolean) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function RowContextMenu({
  children,
  entityKind,
  viewType,
  entityId: _entityId,
  isVisible,
  isFirst,
  isLast,
  disabled = false,
  selectedCount = 0,
  isInSelection = false,
  isMixedSelection = false,
  moveToTargets = [],
  currentParentId,
  categoryTargets = [],
  attachedCategoryIds = [],
  labelTargets = [],
  attachedLabelIds = [],
  onOpenChange,
  onClone,
  onVisibilityToggle,
  onRemove,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveTo,
  onCategoryToggle,
  onLabelToggle,
}: RowContextMenuProps) {
  const isMac = useIsMac();

  // Search state for manage-categories and manage-labels submenus
  const [categorySearch, setCategorySearch] = React.useState("");
  const [labelSearch, setLabelSearch] = React.useState("");

  // Reset search when menu closes
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        setCategorySearch("");
        setLabelSearch("");
      }
      onOpenChange?.(open);
    },
    [onOpenChange]
  );

  // Get actions for this view + entity combination
  const key: ViewEntityKey = `${viewType}:${entityKind}`;
  const allActionIds = CONTEXT_MENU_CONFIG[key] ?? [];

  // Determine bulk mode: in selection AND more than 1 selected
  const isBulkMode = isInSelection && selectedCount > 1;
  // Show count only when bulk mode with count > 1
  const showCount = isBulkMode;
  const bulkCount = isBulkMode ? selectedCount : 1;

  // Filter actions based on bulk mode (hide non-bulk actions when in bulk mode)
  const actionIds = isBulkMode
    ? allActionIds.filter((id) => CONTEXT_MENU_ACTIONS[id].supportsBulk)
    : allActionIds;

  // If no actions, just render children without context menu
  if (allActionIds.length === 0 || disabled) {
    return <>{children}</>;
  }

  // Filter move targets (exclude current parent)
  const filteredMoveTargets = moveToTargets.filter(
    (target) => target.id !== currentParentId
  );

  // Entity label for header
  const entityLabel = entityKind === "label" ? "label" : entityKind === "category" ? "category" : "product";
  const entityLabelPlural = entityKind === "category" ? "categories" : entityLabel + "s";

  // Helper to render label with optional count
  const renderLabel = (label: string) => {
    if (showCount) {
      return `${label} (${bulkCount})`;
    }
    return label;
  };

  // Render individual action
  const renderAction = (actionId: ContextMenuActionId) => {
    const action = CONTEXT_MENU_ACTIONS[actionId];
    const Icon = action.icon;
    const shortcut = formatKbd(action.kbd, isMac);

    switch (actionId) {
      case "clone":
        return (
          <ContextMenuItem
            key={actionId}
            onClick={onClone}
            disabled={!onClone}
          >
            <Icon className="size-4" />
            {renderLabel(action.label)}
            {shortcut && <Kbd className="ml-auto">{shortcut}</Kbd>}
          </ContextMenuItem>
        );

      case "visibility":
        return (
          <ContextMenuItem
            key={actionId}
            onClick={() => onVisibilityToggle?.(!isVisible)}
            disabled={!onVisibilityToggle}
          >
            <Icon className="size-4" />
            {renderLabel(action.label)}
            {shortcut && <Kbd className="ml-auto">{shortcut}</Kbd>}
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
            {renderLabel(action.label)}
            {shortcut && <Kbd className="ml-auto">{shortcut}</Kbd>}
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
            {renderLabel(action.label)}
            {shortcut && <Kbd className="ml-auto">{shortcut}</Kbd>}
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
            {shortcut && <Kbd className="ml-auto">{shortcut}</Kbd>}
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
            {shortcut && <Kbd className="ml-auto">{shortcut}</Kbd>}
          </ContextMenuItem>
        );

      case "move-to": {
        if (filteredMoveTargets.length === 0) {
          return (
            <ContextMenuItem key={actionId} disabled>
              <Icon className="size-4" />
              {action.label}
            </ContextMenuItem>
          );
        }

        // Header based on entity type: categories move to Labels, products move to Categories
        const moveToHeader = entityKind === "category" ? "Labels" : "Categories";

        return (
          <ContextMenuSub key={actionId}>
            <ContextMenuSubTrigger className="gap-2">
              <Icon className="size-4" />
              {action.label}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="max-h-64 overflow-y-auto">
              <ContextMenuLabel className="text-xs font-normal text-muted-foreground">
                {moveToHeader}
              </ContextMenuLabel>
              <ContextMenuSeparator />
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
      }

      case "manage-categories": {
        if (categoryTargets.length === 0) {
          return (
            <ContextMenuItem key={actionId} disabled>
              <Icon className="size-4" />
              {action.label}
            </ContextMenuItem>
          );
        }

        // Filter by search, then section into Added and Available
        const searchLower = categorySearch.toLowerCase();
        const filteredCategories = categorySearch
          ? categoryTargets.filter((c) => c.name.toLowerCase().includes(searchLower))
          : categoryTargets;

        const addedCategories = filteredCategories
          .filter((c) => attachedCategoryIds.includes(c.id))
          .sort((a, b) => a.name.localeCompare(b.name));
        const availableCategories = filteredCategories
          .filter((c) => !attachedCategoryIds.includes(c.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        return (
          <ContextMenuSub key={actionId}>
            <ContextMenuSubTrigger className="gap-2">
              <Icon className="size-4" />
              {action.label}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-56 p-0">
              <CheckboxListContent
                variant="context-menu"
                searchable
                searchPlaceholder="Search categories..."
                searchValue={categorySearch}
                onSearchChange={setCategorySearch}
                sections={[
                  {
                    label: "Added",
                    items: addedCategories.map((c) => ({
                      id: c.id,
                      name: c.name,
                      checked: true,
                    })),
                  },
                  {
                    label: "Available",
                    items: availableCategories.map((c) => ({
                      id: c.id,
                      name: c.name,
                      checked: false,
                    })),
                  },
                ]}
                onItemToggle={(categoryId, checked) => {
                  onCategoryToggle?.(categoryId, checked);
                }}
                emptyMessage="No categories found"
              />
            </ContextMenuSubContent>
          </ContextMenuSub>
        );
      }

      case "manage-labels": {
        if (labelTargets.length === 0) {
          return (
            <ContextMenuItem key={actionId} disabled>
              <Icon className="size-4" />
              {action.label}
            </ContextMenuItem>
          );
        }

        // Filter by search, then section into Added and Available
        const labelSearchLower = labelSearch.toLowerCase();
        const filteredLabels = labelSearch
          ? labelTargets.filter((l) => l.name.toLowerCase().includes(labelSearchLower))
          : labelTargets;

        const addedLabels = filteredLabels
          .filter((l) => attachedLabelIds.includes(l.id))
          .sort((a, b) => a.name.localeCompare(b.name));
        const availableLabels = filteredLabels
          .filter((l) => !attachedLabelIds.includes(l.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        return (
          <ContextMenuSub key={actionId}>
            <ContextMenuSubTrigger className="gap-2">
              <Icon className="size-4" />
              {action.label}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-56 p-0">
              <CheckboxListContent
                variant="context-menu"
                searchable
                searchPlaceholder="Search labels..."
                searchValue={labelSearch}
                onSearchChange={setLabelSearch}
                sections={[
                  {
                    label: "Added",
                    items: addedLabels.map((l) => ({
                      id: l.id,
                      name: l.name,
                      checked: true,
                    })),
                  },
                  {
                    label: "Available",
                    items: availableLabels.map((l) => ({
                      id: l.id,
                      name: l.name,
                      checked: false,
                    })),
                  },
                ]}
                onItemToggle={(labelId, checked) => {
                  onLabelToggle?.(labelId, checked);
                }}
                emptyMessage="No labels found"
              />
            </ContextMenuSubContent>
          </ContextMenuSub>
        );
      }

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
  const deleteAction = actionIds.includes("delete") ? (["delete"] as ContextMenuActionId[]) : [];

  // Mixed selection: show disabled menu
  if (isMixedSelection && isInSelection) {
    return (
      <ContextMenu onOpenChange={handleOpenChange}>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            <AlertTriangle className="size-4" />
            <span>Mixed selection</span>
          </div>
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Select items of the same type for bulk actions
          </p>
          <ContextMenuSeparator />
          {/* Show all actions as disabled */}
          {allActionIds.map((actionId) => {
            const action = CONTEXT_MENU_ACTIONS[actionId];
            const Icon = action.icon;
            return (
              <ContextMenuItem key={actionId} disabled>
                <Icon className="size-4" />
                {action.label}
              </ContextMenuItem>
            );
          })}
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Bulk mode header */}
        {showCount && (
          <>
            <ContextMenuLabel className="text-xs font-normal text-muted-foreground">
              {bulkCount} {bulkCount === 1 ? entityLabel : entityLabelPlural} selected
            </ContextMenuLabel>
            <ContextMenuSeparator />
          </>
        )}

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
        {deleteAction.map(renderAction)}
      </ContextMenuContent>
    </ContextMenu>
  );
}
