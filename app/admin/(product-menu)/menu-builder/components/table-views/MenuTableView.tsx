"use client";
"use no memo";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "motion/react";
import { Eye, EyeOff, LayoutGrid } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  useContextRowHighlight,
  useMoveHandlers,
  useBulkAction,
  useDeleteConfirmation,
  useContextClone,
  useContextVisibility,
  useContextMoveTo,
} from "../../../hooks/context-menu";
import { useContextRowUiState } from "../../../hooks/useContextRowUiState";
import { useInlineEditHandlers } from "../../../hooks/useInlineEditHandlers";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { CheckboxCell } from "./shared/cells/CheckboxCell";
import { ChevronToggleCell } from "./shared/cells/ChevronToggleCell";
import { TouchTarget } from "./shared/cells/TouchTarget";
import { InlineIconCell } from "./shared/cells/InlineIconCell";
import { InlineNameEditor } from "./shared/cells/InlineNameEditor";
import { RowContextMenu } from "./shared/cells/RowContextMenu";
import { menuViewWidthPreset } from "./shared/table/columnWidthPresets";
import { EmptyState } from "./shared/table/EmptyState";
import { TableCell } from "./shared/table/TableCell";
import { TableHeader, type TableHeaderColumn } from "./shared/table/TableHeader";
import { TableRow } from "./shared/table/TableRow";
import { TableViewWrapper } from "./shared/table/TableViewWrapper";
import {
  HierarchyNameCell,
  HierarchyCheckbox,
  HierarchyChevron,
  HierarchyIcon,
  HierarchyName,
} from "./shared/cells/HierarchyNameCell";
import type {
  FlatCategoryRow,
  FlatLabelRow,
  FlatMenuRow,
} from "./MenuTableView.types";
import { isCategoryRow, isLabelRow, getRowMeta } from "./MenuTableView.types";
import { useFlattenedMenuRows } from "../../../hooks/useFlattenedMenuRows";
import { useContextSelectionModel } from "../../../hooks/useContextSelectionModel";
import { buildMenuRegistry } from "../../../hooks/useIdentityRegistry";
import { useRowClickHandler } from "../../../hooks/useRowClickHandler";
import { useMultiEntityDnd } from "../../../hooks/dnd/useMultiEntityDnd";
import { useDnDEligibility } from "../../../hooks/dnd/useDnDEligibility";
import { GroupedEntitiesGhost, GhostRowContent } from "./shared/table/GroupedEntitiesGhost";
import { useGroupedEntitiesGhost } from "../../../hooks/dnd/useGroupedEntitiesGhost";
import { DragHandleCell } from "./shared/cells/DragHandleCell";

// Column order: name (with inline checkbox), categories, visibility, products, dragHandle
// Checkbox is inside name column, indenting with hierarchy depth
const MENU_VIEW_HEADER_COLUMNS: TableHeaderColumn[] = [
  { id: "name", label: "Name", hasInlineCheckbox: true },
  { id: "categories", label: "Categories" },
  { id: "visibility", label: "Visibility" },
  { id: "products", label: "Products" },
  { id: "dragHandle", label: "" },
];

/**
 * MenuTableView - 2-level hierarchical table showing Labels → Categories
 *
 * Features:
 * - Only shows visible labels (isVisible=true)
 * - Expand/collapse for labels
 * - Level-based indentation (0px labels, 24px categories)
 * - Drag-and-drop reordering (same-level and same-parent only)
 * - Auto-collapse all on label drag
 * - Selection (single entity type at a time)
 * - Inline editing for label names and icons
 * - Eye icon for visibility (read-only display)
 * - Product count shown as info column (products managed in Category Detail)
 *
 * Note: Products are not included in the selection registry. Product count
 * is displayed but product management is done in Category Detail view.
 */
export function MenuTableView() {
  const {
    builder,
    labels,
    categories,
    products,
    updateLabel,
    updateCategory,
    reorderLabels,
    reorderCategoriesInLabel,
    attachCategory,
    detachCategory,
    deleteLabel,
    deleteCategory,
    cloneLabel,
    cloneCategory,
  } = useMenuBuilder();

  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Context menu row highlighting
  const { isContextRow, handleContextOpenChange } = useContextRowHighlight();

  // Delete confirmation dialog (works for both labels and categories)
  const {
    deleteConfirmation,
    isDeleting,
    requestDelete,
    confirmDelete,
    cancelDelete,
  } = useDeleteConfirmation({
    deleteEntity: (kind, id) =>
      kind === "label" ? deleteLabel(id) : deleteCategory(id),
  });

  // Filter to only show visible labels in the menu table
  const visibleLabels = useMemo(
    () => labels.filter((l) => l.isVisible),
    [labels]
  );

  // Flatten hierarchy into rows based on expand state (only visible labels)
  const rows = useFlattenedMenuRows({
    labels: visibleLabels,
    categories,
    products,
    expandedIds: builder.expandedIds,
  });

  // Row UI state for label editing
  const {
    editingId: editingLabelId,
    pinnedId: pinnedLabelId,
    clearEditing,
    clearPinnedIfMatches,
  } = useContextRowUiState(builder, "label", { autoClearPinned: true });

  // Build registry for hierarchical selection (uses kind-prefixed keys)
  // Note: Registry is 2-level only (labels + categories), products are display-only
  const registry = useMemo(
    () => buildMenuRegistry(visibleLabels),
    [visibleLabels]
  );

  // Unified selection model with hierarchy support for tri-state checkboxes
  const {
    getCheckboxState,
    onToggle,
    onToggleWithHierarchy,
    selectionState,
    onSelectAll,
    actionableRoots,
    selectedKind,
    isSameKind,
    anchorKey,
    rangeSelect,
  } = useContextSelectionModel(builder, {
    selectableKeys: registry.allKeys as string[],
    hierarchy: { getDescendants: (key) => registry.getChildKeys(key) as string[] },
  });

  // Derive DnD eligibility from selection state (action-bar pattern)
  const eligibility = useDnDEligibility({
    actionableRoots,
    selectedKind,
    isSameKind,
    registry,
  });

  // Debounced expand/collapse to prevent rapid toggling
  const EXPAND_DEBOUNCE_MS = 500;
  const lastExpandTimeRef = useRef<number>(0);

  const debouncedToggleExpand = useCallback(
    (id: string) => {
      const now = Date.now();
      if (now - lastExpandTimeRef.current < EXPAND_DEBOUNCE_MS) {
        return; // Ignore rapid toggles
      }
      lastExpandTimeRef.current = now;
      builder.toggleExpand(id);
    },
    [builder]
  );

  // Unified click handler with expand/collapse sync and range selection
  const { handleClick, handleDoubleClick } = useRowClickHandler(registry, {
    onToggle,
    onToggleWithHierarchy,
    getCheckboxState,
    expandedIds: builder.expandedIds,
    toggleExpand: debouncedToggleExpand,
    navigate: (kind, entityId) => {
      switch (kind) {
        case "label":
          builder.navigateToLabel(entityId);
          break;
        case "category":
          builder.navigateToCategory(entityId);
          break;
        // Products don't have a dedicated view
      }
    },
    rangeSelect,
    anchorKey,
  });

  const { toast } = useToast();

  // Check if a label name already exists (case-insensitive)
  const isDuplicateLabelName = useCallback(
    (name: string, excludeId: string) => {
      const normalizedName = name.trim().toLowerCase();
      return labels.some(
        (l) => l.id !== excludeId && l.name.trim().toLowerCase() === normalizedName
      );
    },
    [labels]
  );

  // Inline edit handlers for label name, icon
  const { handleNameSave, handleIconSave } = useInlineEditHandlers({
    builder,
    entityKind: "label",
    getItem: (id) => labels.find((l) => l.id === id),
    updateItem: updateLabel,
    onSaveComplete: clearEditing,
    isDuplicateName: isDuplicateLabelName,
    onError: (message) => toast({ title: "Error", description: message, variant: "destructive" }),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Context menu data (targets for submenus)
  // ─────────────────────────────────────────────────────────────────────────────

  // Get move targets for categories (other visible labels, excluding current parent)
  const getMoveTargetsForCategory = useCallback(
    (currentLabelId: string) => {
      return visibleLabels
        .filter((l) => l.id !== currentLabelId)
        .map((l) => ({ id: l.id, name: l.name }));
    },
    [visibleLabels]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Context menu handlers (using shared hooks)
  // ─────────────────────────────────────────────────────────────────────────────

  // Label move up/down handlers
  const {
    handleMoveUp: handleLabelMoveUp,
    handleMoveDown: handleLabelMoveDown,
    getPositionFlags: getLabelPositionFlags,
  } = useMoveHandlers({
    items: visibleLabels,
    reorder: reorderLabels,
  });

  // Bulk action support for label context menu operations
  const { getTargetIds: getLabelTargetIds } = useBulkAction({
    isSelected: (key) => getCheckboxState(key) === "checked",
    actionableRoots,
    isSameKind,
    entityKind: "label",
  });

  // Bulk action support for category context menu operations
  const { getTargetIds: getCategoryTargetIds } = useBulkAction({
    isSelected: (key) => getCheckboxState(key) === "checked",
    actionableRoots,
    isSameKind,
    entityKind: "category",
  });

  // Label clone (with bulk support)
  const { handleClone: handleLabelContextClone } = useContextClone({
    cloneEntity: (id) => cloneLabel({ id }),
    getTargetIds: getLabelTargetIds,
    entityLabel: { singular: "Label", plural: "labels" },
  });

  // Label delete handler
  const handleLabelContextDelete = useCallback(
    (labelId: string) => {
      requestDelete(labelId, "label", getLabelTargetIds);
    },
    [requestDelete, getLabelTargetIds]
  );

  // Label visibility toggle (Remove from menu = set isVisible to false)
  const { handleVisibilityToggle: handleLabelContextVisibility } = useContextVisibility({
    updateEntity: (id, visible) => updateLabel(id, { isVisible: visible }),
    getTargetIds: getLabelTargetIds,
    entityLabel: { singular: "Label", plural: "labels" },
  });

  // Category clone (with bulk support)
  const { handleClone: handleCategoryContextClone } = useContextClone({
    cloneEntity: (id) => cloneCategory({ id }),
    getTargetIds: getCategoryTargetIds,
    entityLabel: { singular: "Category", plural: "categories" },
  });

  // Category visibility toggle (with bulk support)
  const { handleVisibilityToggle: handleCategoryContextVisibility } = useContextVisibility({
    updateEntity: (id, visible) => updateCategory(id, { isVisible: visible }),
    getTargetIds: getCategoryTargetIds,
    entityLabel: { singular: "Category", plural: "categories" },
  });

  // Category move up/down within parent label (using unified hook with nested pattern)
  const {
    handleMoveUp: handleCategoryMoveUp,
    handleMoveDown: handleCategoryMoveDown,
  } = useMoveHandlers({
    getItems: (parentId) => {
      const label = visibleLabels.find((l) => l.id === parentId);
      return label?.categories ?? [];
    },
    reorder: (ids, parentId) => reorderCategoriesInLabel(parentId!, ids),
  });

  // Category move to another label (uses handleMoveToFrom for dynamic parent)
  const { handleMoveToFrom: handleCategoryMoveTo } = useContextMoveTo({
    detach: detachCategory,
    attach: attachCategory,
    getEntityName: (id) => categories.find((c) => c.id === id)?.name,
    getTargetName: (id) => visibleLabels.find((l) => l.id === id)?.name,
    entityLabel: "Category",
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Drag & Drop handlers
  // ─────────────────────────────────────────────────────────────────────────────

  // Move category from one label to another via DnD (detach + attach + reorder)
  const moveCategoryToLabel = useCallback(
    async (
      categoryId: string,
      fromLabelId: string,
      toLabelId: string,
      targetCategoryId: string | null,
      dropPosition: "before" | "after"
    ) => {
      // Get category and label names for toast
      const category = categories.find((c) => c.id === categoryId);
      const toLabel = labels.find((l) => l.id === toLabelId);
      const categoryName = category?.name ?? "Category";
      const labelName = toLabel?.name ?? "Label";

      // Detach from source label
      const detachResult = await detachCategory(fromLabelId, categoryId);
      if (!detachResult.ok) {
        toast({
          title: "Move failed",
          description: `Failed to remove from source label`,
          variant: "destructive",
        });
        return { ok: false, error: detachResult.error };
      }

      // Attach to target label
      const attachResult = await attachCategory(toLabelId, categoryId);
      if (!attachResult.ok) {
        // Try to revert the detach
        await attachCategory(fromLabelId, categoryId);
        toast({
          title: "Move failed",
          description: `Failed to add to target label`,
          variant: "destructive",
        });
        return { ok: false, error: attachResult.error };
      }

      // Reorder to place at correct position
      if (targetCategoryId) {
        // Get current categories in target label (sorted by order)
        const targetLabelData = toLabel;
        if (targetLabelData) {
          const currentCategoryIds = targetLabelData.categories
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((c) => c.id);

          // Find target index and insert the moved category
          const targetIndex = currentCategoryIds.indexOf(targetCategoryId);
          if (targetIndex !== -1) {
            // Remove the moved category from current position (it was just attached, likely at end)
            const newOrder = currentCategoryIds.filter((id) => id !== categoryId);
            // Insert at the correct position
            const insertIndex = dropPosition === "before" ? targetIndex : targetIndex + 1;
            newOrder.splice(insertIndex, 0, categoryId);
            // Apply the new order
            await reorderCategoriesInLabel(toLabelId, newOrder);
          }
        }
      }

      // Show success toast
      toast({
        title: "Category moved",
        description: `Moved "${categoryName}" to "${labelName}"`,
      });

      return { ok: true };
    },
    [categories, labels, attachCategory, detachCategory, reorderCategoriesInLabel, toast]
  );

  // Hierarchical drag-and-drop with expand on enter, collapse on leave
  // Uses eligibility computed from selection (action-bar pattern)
  const { getDragHandlers: getBaseDragHandlers, getDragClasses, getIsDraggable, dragState, eligibleEntityIds } = useMultiEntityDnd({
    rows,
    labels: visibleLabels,
    reorderFunctions: {
      reorderLabels,
      reorderCategoriesInLabel,
      moveCategoryToLabel,
    },
    pushUndoAction: builder.pushUndoAction,
    onExpandItem: builder.toggleExpand,
    onCollapseItem: builder.toggleExpand,
    eligibility,
    registry,
    // Update selection after cross-boundary moves (category keys include parent label ID)
    onSelectionUpdate: (newKeys) => builder.selectAll(newKeys),
  });

  // Multi-drag ghost for count badge
  const GHOST_ID = "menu-view-drag-ghost";
  const { setGhostImage } = useGroupedEntitiesGhost(GHOST_ID);

  // Get first selected item for ghost content
  // Uses actionableRoots (pre-computed from selection) so ghost is ready BEFORE drag starts
  // Always compute when there's at least one selection so ghost is pre-rendered
  const firstSelectedItem = useMemo(() => {
    if (actionableRoots.length === 0) return null;

    // Extract entity IDs from actionable root keys (format: "kind:id" or "kind:parentId~id")
    const actionableEntityIds = new Set(
      actionableRoots.map((key) => {
        const colonIdx = key.indexOf(":");
        if (colonIdx === -1) return key;
        const idPart = key.slice(colonIdx + 1);
        // For categories, the ID part is "labelId~categoryId", extract categoryId
        const tildeIdx = idPart.indexOf("~");
        return tildeIdx > -1 ? idPart.slice(tildeIdx + 1) : idPart;
      })
    );

    // Find the first row that matches an actionable entity
    for (const row of rows) {
      if (actionableEntityIds.has(row.id)) {
        return row;
      }
    }
    return null;
  }, [actionableRoots, rows]);

  // Wrap drag handlers to auto-collapse on label drag and set ghost image
  const getDragHandlers = useCallback(
    (row: FlatMenuRow) => {
      const baseHandlers = getBaseDragHandlers(row);
      const rowKey = getRowMeta(row).key;
      // Use actionableRoots for multi-drag check (consistent with selection model)
      const isInActionableRoots = actionableRoots.includes(rowKey);
      const isMultiDrag = isInActionableRoots && actionableRoots.length > 1;

      return {
        ...baseHandlers,
        onDragStart: (e: React.DragEvent) => {
          // Auto-collapse all when dragging a label
          if (row.level === "label") {
            builder.collapseAll();
          }
          baseHandlers.onDragStart(e);
          // Set ghost image synchronously - must happen during dragstart event
          // Ghost is pre-rendered based on actionableRoots so it exists before drag starts
          if (isMultiDrag) {
            setGhostImage(e);
          }
        },
      };
    },
    [getBaseDragHandlers, builder, actionableRoots, setGhostImage]
  );

  // Render a label row
  const renderLabelRow = (row: FlatLabelRow, isLastRow: boolean) => {
    const label = row.data;
    const labelKey = getRowMeta(row).key;
    const checkboxState = getCheckboxState(labelKey);
    const isSelected = checkboxState === "checked";
    const isIndeterminate = checkboxState === "indeterminate";
    const isRowHovered = hoveredRowId === row.id;
    const isRowContextMenu = isContextRow(row.id);
    const labelPositionFlags = getLabelPositionFlags(row.id);
    const dragClasses = getDragClasses(row);
    const dragHandlers = getDragHandlers(row);
    const isPinned = pinnedLabelId === row.id;

    // Get cursor styling state for this row
    const isDraggable = getIsDraggable(row.id);

    return (
      <RowContextMenu
        key={row.id}
        entityKind="label"
        viewType="menu"
        entityId={row.id}
        isVisible={true}
        isFirst={labelPositionFlags.isFirst}
        isLast={labelPositionFlags.isLast}
        selectedCount={actionableRoots.length}
        isInSelection={isSelected || isIndeterminate}
        isMixedSelection={actionableRoots.length > 0 && !isSameKind}
        onOpenChange={handleContextOpenChange(row.id)}
        onClone={() => handleLabelContextClone(row.id)}
        onRemove={() => handleLabelContextVisibility(row.id, false)}
        onDelete={() => handleLabelContextDelete(row.id)}
        onMoveUp={() => handleLabelMoveUp(row.id)}
        onMoveDown={() => handleLabelMoveDown(row.id)}
      >
      <TableRow
        data-state={isSelected ? "selected" : undefined}
        isSelected={isSelected || isIndeterminate}
        isContextRow={isRowContextMenu}
        isDragging={dragClasses.isDragging || dragClasses.isInDragSet}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
        isDraggable={isDraggable}
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragOver={dragHandlers.onDragOver}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={dragHandlers.onDrop}
        onDragEnd={dragHandlers.onDragEnd}
        onMouseEnter={() => setHoveredRowId(row.id)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          // Drop position indicator for reorder (same parent)
          dragClasses.isDragOver &&
            dragClasses.dropType === "reorder" &&
            (dragClasses.dropPosition === "after"
              ? "!border-b-2 !border-b-primary"
              : "!border-t-2 !border-t-primary"),
          // Flash animation for cross-boundary move target (only on collapsed labels)
          dragClasses.isDragOver &&
            dragClasses.dropType === "move-to-label" &&
            !row.isExpanded &&
            "animate-drop-target-flash",
          // Auto-expand flash (only when actually expanding a collapsed label)
          dragClasses.isAutoExpanded && "animate-auto-expand-flash"
        )}
        onRowClick={(options) => handleClick(labelKey, options)}
        onRowDoubleClick={() => handleDoubleClick(labelKey)}
      >
        {/* Name with checkbox, chevron, icon, and inline editing */}
        <TableCell config={menuViewWidthPreset.name}>
          <HierarchyNameCell depth={0}>
            <HierarchyCheckbox>
              <TouchTarget>
                <CheckboxCell
                  id={row.id}
                  checked={isSelected}
                  indeterminate={isIndeterminate}
                  onToggle={() => handleClick(labelKey)}
                  isSelectable
                  alwaysVisible={isSelected || isIndeterminate}
                  ariaLabel={`Select ${row.name}`}
                  anchorKey={anchorKey}
                  onRangeSelect={anchorKey && anchorKey !== labelKey ? () => rangeSelect(labelKey) : undefined}
                />
              </TouchTarget>
            </HierarchyCheckbox>
            <HierarchyChevron>
              <TouchTarget>
                <ChevronToggleCell
                  isExpanded={row.isExpanded}
                  isExpandable={row.isExpandable}
                  onToggle={() => debouncedToggleExpand(row.id)}
                  ariaLabel={`${row.isExpanded ? "Collapse" : "Expand"} ${row.name}`}
                  disabled={dragState.isDraggingLabel}
                />
              </TouchTarget>
            </HierarchyChevron>
            {/* Icon + Name as visual unit with tighter spacing */}
            <div className="flex items-center gap-1">
              <HierarchyIcon>
                <InlineIconCell
                  id={row.id}
                  icon={label.icon}
                  onSave={handleIconSave}
                  isRowHovered={isRowHovered}
                />
              </HierarchyIcon>
              <HierarchyName>
                <InlineNameEditor
                  id={row.id}
                  initialValue={row.name}
                  isEditing={editingLabelId === row.id}
                  onStartEdit={() => builder.setEditing({ kind: "label", id: row.id })}
                  onCancelEdit={() => {
                    clearEditing();
                    if (isPinned) {
                      clearPinnedIfMatches(row.id);
                    }
                  }}
                  onSave={async (id, name) => {
                    await handleNameSave(id, name);
                    if (isPinned) {
                      clearPinnedIfMatches(row.id);
                    }
                  }}
                />
              </HierarchyName>
            </div>
          </HierarchyNameCell>
        </TableCell>

        {/* Categories count */}
        <TableCell config={menuViewWidthPreset.categories}>
          <span className="text-sm">{row.categoryCount}</span>
        </TableCell>

        {/* Visibility (eye icon - read only, centered) */}
        <TableCell config={menuViewWidthPreset.visibility}>
          <div className="flex items-center justify-center">
            <Eye className="h-4 w-4" />
          </div>
        </TableCell>

        {/* Products count */}
        <TableCell config={menuViewWidthPreset.products}>
          <span className="text-sm">{row.productCount}</span>
        </TableCell>

        {/* Drag Handle */}
        <TableCell config={menuViewWidthPreset.dragHandle} data-row-click-ignore>
          <DragHandleCell
            isEligible={eligibility.canDrag}
            isRowInEligibleSet={eligibleEntityIds.has(row.id)}
            checkboxState={checkboxState}
            isRowHovered={isRowHovered}
          />
        </TableCell>
      </TableRow>
      </RowContextMenu>
    );
  };

  // Render a category row (leaf node in 2-level view - no chevron)
  const renderCategoryRow = (
    row: FlatCategoryRow,
    isLastRow: boolean,
    staggerIndex: number,
    isFirstInParent: boolean,
    isLastInParent: boolean
  ) => {
    const meta = getRowMeta(row);
    // Use composite key (reactKey) to handle same category under multiple labels
    const compositeId = meta.reactKey;
    const categoryKey = meta.key;
    const checkboxState = getCheckboxState(categoryKey);
    const isSelected = checkboxState === "checked";
    // Categories are leaf nodes in 2-level view - no indeterminate state
    const isRowHovered = hoveredRowId === compositeId;
    const isRowContextMenu = isContextRow(compositeId);
    const dragClasses = getDragClasses(row);
    const dragHandlers = getDragHandlers(row);

    // Get cursor styling state for this row
    const isDraggable = getIsDraggable(row.id);

    // Get move targets (other visible labels)
    const moveTargets = getMoveTargetsForCategory(row.parentId);

    return (
      <RowContextMenu
        key={compositeId}
        entityKind="category"
        viewType="menu"
        entityId={row.id}
        isVisible={row.isVisible}
        isFirst={isFirstInParent}
        isLast={isLastInParent}
        selectedCount={actionableRoots.length}
        isInSelection={isSelected}
        isMixedSelection={actionableRoots.length > 0 && !isSameKind}
        moveToTargets={moveTargets}
        currentParentId={row.parentId}
        onOpenChange={handleContextOpenChange(compositeId)}
        onClone={() => handleCategoryContextClone(row.id)}
        onVisibilityToggle={(visible) => handleCategoryContextVisibility(row.id, visible)}
        onMoveUp={() => handleCategoryMoveUp(row.id, row.parentId)}
        onMoveDown={() => handleCategoryMoveDown(row.id, row.parentId)}
        onMoveTo={(targetLabelId) => handleCategoryMoveTo(row.id, row.parentId, targetLabelId)}
      >
      <TableRow
        animated
        layoutId={compositeId}
        staggerIndex={staggerIndex}
        data-state={isSelected ? "selected" : undefined}
        isSelected={isSelected}
        isContextRow={isRowContextMenu}
        isHidden={!row.isVisible}
        isDragging={dragClasses.isDragging || dragClasses.isInDragSet}
        isDragOver={dragClasses.isDragOver}
        isLastRow={isLastRow}
        isDraggable={isDraggable}
        draggable
        onDragStart={dragHandlers.onDragStart}
        onDragOver={dragHandlers.onDragOver}
        onDragLeave={dragHandlers.onDragLeave}
        onDrop={dragHandlers.onDrop}
        onDragEnd={dragHandlers.onDragEnd}
        onMouseEnter={() => setHoveredRowId(compositeId)}
        onMouseLeave={() => setHoveredRowId(null)}
        className={cn(
          // Drop position indicator - same style for reorder and move
          dragClasses.isDragOver &&
            (dragClasses.dropPosition === "after"
              ? "!border-b-2 !border-b-primary"
              : "!border-t-2 !border-t-primary")
        )}
        onRowClick={(options) => handleClick(categoryKey, options)}
        onRowDoubleClick={() => handleDoubleClick(categoryKey)}
      >
        {/* Name with checkbox and indent (no chevron - leaf node) */}
        <TableCell config={menuViewWidthPreset.name}>
          <HierarchyNameCell depth={1}>
            <HierarchyCheckbox>
              <TouchTarget>
                <CheckboxCell
                  id={compositeId}
                  checked={isSelected}
                  onToggle={() => handleClick(categoryKey)}
                  isSelectable
                  alwaysVisible={isSelected}
                  ariaLabel={`Select ${row.name}`}
                  anchorKey={anchorKey}
                  onRangeSelect={anchorKey && anchorKey !== categoryKey ? () => rangeSelect(categoryKey) : undefined}
                />
              </TouchTarget>
            </HierarchyCheckbox>
            <HierarchyName>
              <span className="truncate font-medium">{row.name}</span>
            </HierarchyName>
          </HierarchyNameCell>
        </TableCell>

        {/* Categories count (empty for categories) */}
        <TableCell config={menuViewWidthPreset.categories}>
          <span className="text-sm text-muted-foreground">—</span>
        </TableCell>

        {/* Visibility (eye icon, centered) */}
        <TableCell config={menuViewWidthPreset.visibility}>
          <div className="flex items-center justify-center">
            {row.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </div>
        </TableCell>

        {/* Products count */}
        <TableCell config={menuViewWidthPreset.products}>
          <span className="text-sm">{row.productCount}</span>
        </TableCell>

        {/* Drag Handle */}
        <TableCell config={menuViewWidthPreset.dragHandle} data-row-click-ignore>
          <DragHandleCell
            isEligible={eligibility.canDrag}
            isRowInEligibleSet={eligibleEntityIds.has(row.id)}
            checkboxState={checkboxState}
            isRowHovered={isRowHovered}
          />
        </TableCell>
      </TableRow>
      </RowContextMenu>
    );
  };

  // Pre-calculate stagger indices and position info for cascade animation
  // Each category gets its index among siblings (categories with same parentId)
  const { staggerIndices, categoryPositions } = useMemo(() => {
    const indices = new Map<string, number>();
    const counters = new Map<string, number>();
    const categoryPos = new Map<string, { isFirst: boolean; isLast: boolean }>();

    // Count categories per parent for position tracking
    const categoryCounts = new Map<string, number>();
    for (const row of rows) {
      if (isCategoryRow(row)) {
        categoryCounts.set(row.parentId, (categoryCounts.get(row.parentId) ?? 0) + 1);
      }
    }

    // Build stagger indices and category positions
    for (const row of rows) {
      if (isCategoryRow(row)) {
        const count = counters.get(row.parentId) ?? 0;
        const total = categoryCounts.get(row.parentId) ?? 0;
        indices.set(`${row.parentId}-${row.id}`, count);
        categoryPos.set(`${row.parentId}-${row.id}`, {
          isFirst: count === 0,
          isLast: count === total - 1,
        });
        counters.set(row.parentId, count + 1);
      }
    }

    return { staggerIndices: indices, categoryPositions: categoryPos };
  }, [rows]);

  const renderRow = (row: FlatMenuRow, index: number, totalRows: number) => {
    const isLastRow = index === totalRows - 1;

    if (isLabelRow(row)) {
      return renderLabelRow(row, isLastRow);
    }
    if (isCategoryRow(row)) {
      const staggerIndex = staggerIndices.get(`${row.parentId}-${row.id}`) ?? 0;
      const pos = categoryPositions.get(`${row.parentId}-${row.id}`) ?? { isFirst: false, isLast: false };
      return renderCategoryRow(row, isLastRow, staggerIndex, pos.isFirst, pos.isLast);
    }
    return null;
  };

  // Empty state when no visible labels
  if (visibleLabels.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No Menu Items"
        description="Add labels from the dropdown to show them in the menu"
      />
    );
  }

  return (
    <>
      <TableViewWrapper>
        <TableHeader
          columns={MENU_VIEW_HEADER_COLUMNS}
          preset={menuViewWidthPreset}
          hasSelectAll
          allSelected={selectionState.allSelected}
          someSelected={selectionState.someSelected}
          onSelectAll={onSelectAll}
        />

        <TableBody>
          <AnimatePresence initial={false}>
            {rows.map((row, index) => renderRow(row, index, rows.length))}
          </AnimatePresence>
        </TableBody>
      </TableViewWrapper>

      {/* Multi-drag ghost with count badge - pre-rendered based on actionableRoots
          so it exists BEFORE drag starts (setDragImage must be called synchronously).
          Render when any selection exists so ghost is ready when user adds more items.
          Use stable key (just ghostId) to avoid remount on count change.

          TODO: Known bug - ghost may not show when items are selected via individual
          clicks and drag starts immediately. This is a race condition where React
          hasn't finished rendering the updated ghost before dragstart fires.
          Will address in future DnD refactor. */}
      {firstSelectedItem && (
        <GroupedEntitiesGhost
          key={GHOST_ID}
          ghostId={GHOST_ID}
          count={actionableRoots.length}
        >
          <GhostRowContent name={firstSelectedItem.name} />
        </GroupedEntitiesGhost>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => {
          if (!open) cancelDelete();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              Delete {deleteConfirmation.targetIds.length}{" "}
              {deleteConfirmation.entityKind === "label"
                ? deleteConfirmation.targetIds.length === 1 ? "label" : "labels"
                : deleteConfirmation.targetIds.length === 1 ? "category" : "categories"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The{" "}
              {deleteConfirmation.entityKind === "label" ? "label" : "category"} will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
