"use client";

import { useMenuBuilder } from "../../MenuBuilderProvider";

export function PlaceholderTableView() {
  const { builder } = useMenuBuilder();

  return (
    <div className="mt-8 p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
      <p className="font-semibold mb-2">Current view: {builder.currentView}</p>
      {builder.currentLabelId && <p className="text-xs">Label ID: {builder.currentLabelId}</p>}
      {builder.currentCategoryId && (
        <p className="text-xs">Category ID: {builder.currentCategoryId}</p>
      )}
      <div className="mt-4 space-y-1">
        <p className="text-xs">Selected: {builder.selectedIds.length} items</p>
        <p className="text-xs">Expanded: {builder.expandedIds.size} sections</p>
      </div>
      <div className="mt-4 pt-4 border-t border-dashed">
        <p className="text-xs font-medium mb-2">✅ Simplified Architecture:</p>
        <ul className="text-xs space-y-1">
          <li>✓ State in ProductMenuProvider</li>
          <li>✓ Components get their own data</li>
          <li>✓ No prop drilling</li>
          <li>✓ Ready for table views</li>
        </ul>
      </div>
    </div>
  );
}
