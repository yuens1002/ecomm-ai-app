/**
 * Build Row Context
 *
 * Constructs the RowContext object for a single row from various state sources.
 * This centralizes all the context building logic in one place.
 */

import type { CheckboxState } from "../useContextSelectionModel";
import type { EntityKind, RowContext } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Input Types
// ─────────────────────────────────────────────────────────────────────────────

type SelectionInfo = {
  isSelected: boolean;
  checkboxState: CheckboxState;
  anchorKey: string | null;
  onToggle: () => void;
  onRangeSelect: (() => void) | undefined;
};

type UIStateInfo = {
  isRowHovered: boolean;
  isContextRow: boolean;
  isEditing: boolean;
  isPinned: boolean;
};

type PositionInfo = {
  index: number;
  total: number;
};

type DnDInfo = {
  isDraggable: boolean;
  isDragging: boolean;
  isDragActive: boolean;
  dragClasses: string | undefined;
};

type EditHandlers = {
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (id: string, value: string) => Promise<void>;
};

export type BuildRowContextOptions<T> = {
  row: T;
  rowId: string;
  rowKey: string;
  entityKind: EntityKind;
  selection: SelectionInfo;
  uiState: UIStateInfo;
  position: PositionInfo;
  dnd: DnDInfo;
  editHandlers: EditHandlers;
  extra: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Builder Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the row context object from various state sources.
 *
 * This centralizes all the context building in one place, making it easy to
 * understand what data is available to cell renderers.
 */
export function buildRowContext<T>(options: BuildRowContextOptions<T>): RowContext<T> {
  const {
    row,
    rowId,
    rowKey,
    entityKind,
    selection,
    uiState,
    position,
    dnd,
    editHandlers,
    extra,
  } = options;

  return {
    // Row identification
    row,
    rowKey,
    rowId,
    entityKind,

    // Selection state
    isSelected: selection.isSelected,
    checkboxState: selection.checkboxState,
    anchorKey: selection.anchorKey,

    // UI state
    isRowHovered: uiState.isRowHovered,
    isContextRow: uiState.isContextRow,
    isEditing: uiState.isEditing,
    isPinned: uiState.isPinned,

    // Position
    index: position.index,
    isFirstRow: position.index === 0,
    isLastRow: position.index === position.total - 1,

    // DnD state
    isDraggable: dnd.isDraggable,
    isDragging: dnd.isDragging,
    isDragActive: dnd.isDragActive,
    dragClasses: dnd.dragClasses,

    // Handlers
    onToggle: selection.onToggle,
    onRangeSelect: selection.onRangeSelect,
    onStartEdit: editHandlers.onStartEdit,
    onCancelEdit: editHandlers.onCancelEdit,
    onSave: editHandlers.onSave,

    // Extra
    extra,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Default DnD Info (for views without DnD)
// ─────────────────────────────────────────────────────────────────────────────

export const NO_DND: DnDInfo = {
  isDraggable: false,
  isDragging: false,
  isDragActive: false,
  dragClasses: undefined,
};
