"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { MenuSettingsDialog } from "./components/MenuSettingsDialog";
import { MenuNavBar } from "./components/MenuNavBar";
import { MenuActionBar } from "./components/menu-action-bar";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProductMenuProvider, useProductMenu } from "../ProductMenuProvider";
import type { BuilderState, ViewType } from "../types/builder-state";

function MenuBuilderContent() {
  const searchParams = useSearchParams();
  const { labels, categories, products, error } = useProductMenu();
  const { toast } = useToast();

  const currentView = (searchParams.get("view") as ViewType) || "menu";
  const currentLabelId = searchParams.get("labelId") || undefined;
  const currentCategoryId = searchParams.get("categoryId") || undefined;

  // Debug log
  console.log("[MenuBuilder] Products count:", products.length);

  // Builder state derived directly from URL params
  const builderState = useMemo<BuilderState>(
    () => ({
      selectedIds: [], // TODO: Will be managed through state later
      undoStack: [],
      redoStack: [],
      currentView,
      currentLabelId,
      currentCategoryId,
      totalLabels: labels.length,
      totalCategories: categories.length,
      totalProducts: products.length,
    }),
    [
      currentView,
      currentLabelId,
      currentCategoryId,
      labels.length,
      categories.length,
      products.length,
    ]
  );

  // Centralized error handling
  useEffect(() => {
    if (error) {
      toast({
        title: "Failed to load menu data",
        description:
          error.message || "Unable to load the menu builder. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <>
      <PageTitle
        title="Menu Builder"
        subtitle="Group categories under labels, arrange category links and products in categories."
        action={<MenuSettingsDialog />}
      />

      <MenuNavBar
        currentView={currentView}
        currentLabelId={currentLabelId}
        currentCategoryId={currentCategoryId}
      />

      <MenuActionBar
        view={currentView}
        state={builderState}
        labels={labels}
        categories={categories}
        products={products}
      />

      {/* Placeholder for future table views */}
      <div className="mt-8 p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
        <p>Current view: {currentView}</p>
        {currentLabelId && (
          <p className="text-xs">Label ID: {currentLabelId}</p>
        )}
        {currentCategoryId && (
          <p className="text-xs">Category ID: {currentCategoryId}</p>
        )}
        <p className="text-xs mt-2">
          Navigation bar is functional - use dropdowns to switch views
        </p>
        <p className="text-xs mt-2">
          Action bar shows different buttons based on current view
        </p>
      </div>
    </>
  );
}

export default function MenuBuilder() {
  return (
    <ProductMenuProvider>
      <MenuBuilderContent />
    </ProductMenuProvider>
  );
}
