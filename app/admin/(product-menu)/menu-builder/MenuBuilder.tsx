"use client";

import { MenuSettingsDialog } from "./components/MenuSettingsDialog";
import { MenuNavBar } from "./components/MenuNavBar";
import { MenuActionBar } from "./components/menu-action-bar";
import { PageTitle } from "@/components/admin/PageTitle";
import { MenuBuilderProvider, useMenuBuilder } from "./MenuBuilderProvider";

/**
 * Menu Builder Content - Main Component
 *
 * Pure compositional component - just renders sub-components.
 * All state and data comes from MenuBuilderProvider.
 * Sub-components use useMenuBuilder() to get what they need.
 */
function MenuBuilderContent() {
  const { isLoading, error, builder } = useMenuBuilder();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading menu data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p className="font-semibold">Failed to load menu data</p>
          <p className="text-sm mt-2">{error.message || "Please try again"}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        title="Menu Builder"
        subtitle="Group categories under labels, arrange category links and products in categories."
        action={<MenuSettingsDialog />}
      />

      <MenuNavBar />
      <MenuActionBar />

      {/* Placeholder for future table views */}
      <div className="mt-8 p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
        <p className="font-semibold mb-2">
          Current view: {builder.currentView}
        </p>
        {builder.currentLabelId && (
          <p className="text-xs">Label ID: {builder.currentLabelId}</p>
        )}
        {builder.currentCategoryId && (
          <p className="text-xs">Category ID: {builder.currentCategoryId}</p>
        )}
        <div className="mt-4 space-y-1">
          <p className="text-xs">
            Selected: {builder.selectedIds.length} items
          </p>
          <p className="text-xs">
            Expanded: {builder.expandedIds.size} sections
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-dashed">
          <p className="text-xs font-medium mb-2">
            ✅ Simplified Architecture:
          </p>
          <ul className="text-xs space-y-1">
            <li>✓ State in ProductMenuProvider</li>
            <li>✓ Components get their own data</li>
            <li>✓ No prop drilling</li>
            <li>✓ Ready for table views</li>
          </ul>
        </div>
      </div>
    </>
  );
}

/**
 * Menu Builder - Wrapped with Provider
 */
export default function MenuBuilder() {
  return (
    <MenuBuilderProvider>
      <MenuBuilderContent />
    </MenuBuilderProvider>
  );
}
