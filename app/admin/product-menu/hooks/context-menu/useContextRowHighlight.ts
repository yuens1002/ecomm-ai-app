import { useState, useCallback } from "react";

/**
 * useContextRowHighlight - Manages context menu row highlighting state.
 *
 * When a context menu opens on a row, that row should be visually highlighted
 * (similar to selection but distinct). This hook provides the state and handlers
 * for managing this highlight.
 *
 * @example
 * ```tsx
 * const { contextRowId, isContextRow, handleContextOpenChange } = useContextRowHighlight();
 *
 * // In row renderer:
 * <RowContextMenu onOpenChange={handleContextOpenChange(row.id)}>
 *   <TableRow isContextRow={isContextRow(row.id)}>
 *     ...
 *   </TableRow>
 * </RowContextMenu>
 * ```
 */
export type UseContextRowHighlightReturn = {
  /** Current row ID that has context menu open, or null */
  contextRowId: string | null;
  /** Check if a specific row is the context row */
  isContextRow: (rowId: string) => boolean;
  /** Handler factory for context menu open/close events */
  handleContextOpenChange: (rowId: string) => (open: boolean) => void;
};

export function useContextRowHighlight(): UseContextRowHighlightReturn {
  const [contextRowId, setContextRowId] = useState<string | null>(null);

  const isContextRow = useCallback(
    (rowId: string): boolean => contextRowId === rowId,
    [contextRowId]
  );

  const handleContextOpenChange = useCallback(
    (rowId: string) => (open: boolean) => {
      setContextRowId(open ? rowId : null);
    },
    []
  );

  return {
    contextRowId,
    isContextRow,
    handleContextOpenChange,
  };
}
