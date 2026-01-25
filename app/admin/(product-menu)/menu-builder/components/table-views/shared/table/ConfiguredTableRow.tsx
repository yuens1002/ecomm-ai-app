"use client";

/**
 * Configured Table Row
 *
 * Renders a complete table row from config-driven data.
 * This component reduces boilerplate by handling the common
 * RowContextMenu → TableRow → TableCells structure.
 */

import { RowContextMenu } from "../cells/RowContextMenu";
import { TableRow } from "./TableRow";
import { TableCell } from "./TableCell";
import type { RowRenderResult } from "../../../../../hooks/table-view/types";

type ConfiguredTableRowProps<T> = {
  /** Row render result from useTableView */
  data: RowRenderResult<T>;
};

/**
 * Renders a table row from config-driven render result.
 *
 * @example
 * ```tsx
 * {categories.map((cat, i) => (
 *   <ConfiguredTableRow key={cat.id} data={renderRow(cat, i, total)} />
 * ))}
 * ```
 */
export function ConfiguredTableRow<T>({ data }: ConfiguredTableRowProps<T>) {
  const { key, contextMenuProps, tableRowProps, columns } = data;

  return (
    <RowContextMenu key={key} {...contextMenuProps}>
      <TableRow
        data-state={tableRowProps.isSelected ? "selected" : undefined}
        isSelected={tableRowProps.isSelected}
        isContextRow={tableRowProps.isContextRow}
        isHidden={tableRowProps.isHidden}
        className={tableRowProps.className}
        onRowClick={tableRowProps.onRowClick}
        onRowDoubleClick={tableRowProps.onRowDoubleClick}
        onMouseEnter={tableRowProps.onMouseEnter}
        onMouseLeave={tableRowProps.onMouseLeave}
      >
        {columns.map((col) => (
          <TableCell
            key={col.id}
            config={col.width}
            className={col.className}
            data-row-click-ignore={col.ignoreRowClick || undefined}
          >
            {col.content}
          </TableCell>
        ))}
      </TableRow>
    </RowContextMenu>
  );
}
