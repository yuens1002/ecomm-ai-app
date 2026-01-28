"use client";

import { useMemo } from "react";
import { PageTitle } from "@/components/admin/PageTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumb } from "@/components/admin/dashboard";
import { MenuBuilderProvider, useMenuBuilder } from "./MenuBuilderProvider";
import { MenuNavBar } from "./components/MenuNavBar";
import { MenuSettingsDialog } from "./components/MenuSettingsDialog";
import { MenuActionBar } from "./components/menu-action-bar";
import { MenuTableRenderer as MenuTable } from "./components/table-views/MenuTableRenderer";

/**
 * Menu Builder Content - Main Component
 *
 * Pure compositional component - just renders sub-components.
 * All state and data comes from MenuBuilderProvider.
 * Sub-components use useMenuBuilder() to get what they need.
 */
function MenuBuilderContent() {
  const { isLoading, error, builder, labels, categories } = useMenuBuilder();

  // Compute breadcrumb items based on current view
  const breadcrumbItems = useMemo(() => {
    if (builder.currentView === "label" && builder.currentLabelId) {
      const label = labels.find((l) => l.id === builder.currentLabelId);
      if (label) return [{ label: label.name }];
    }
    if (builder.currentView === "category" && builder.currentCategoryId) {
      const category = categories.find((c) => c.id === builder.currentCategoryId);
      if (category) return [{ label: category.name }];
    }
    return [];
  }, [builder.currentView, builder.currentLabelId, builder.currentCategoryId, labels, categories]);

  useBreadcrumb(breadcrumbItems);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* PageTitle skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* NavBar skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* ActionBar skeleton */}
        <Skeleton className="h-10 w-full" />

        {/* Table skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
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

      <MenuTable />
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
