"use client";

import { MenuSettingsDialog } from "./components/MenuSettingsDialog";
import { MenuNavBar } from "./components/MenuNavBar";
import { MenuActionBar } from "./components/menu-action-bar";
import { PageTitle } from "@/components/admin/PageTitle";
import { MenuBuilderProvider, useMenuBuilder } from "./MenuBuilderProvider";
import { MenuBuilderTable } from "./components/table-views/shared/table/MenuBuilderTable";

/**
 * Menu Builder Content - Main Component
 *
 * Pure compositional component - just renders sub-components.
 * All state and data comes from MenuBuilderProvider.
 * Sub-components use useMenuBuilder() to get what they need.
 */
function MenuBuilderContent() {
  const { isLoading, error } = useMenuBuilder();

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

      <MenuBuilderTable />
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
