"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { MenuSettingsDialog } from "./components/MenuSettingsDialog";
import { MenuNavBar } from "./components/MenuNavBar";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProductMenuProvider, useProductMenu } from "../ProductMenuProvider";

type View = "menu" | "label" | "category" | "all-labels" | "all-categories";

function MenuBuilderContent() {
  const searchParams = useSearchParams();
  const { error } = useProductMenu();
  const { toast } = useToast();

  const currentView = (searchParams.get("view") as View) || "menu";
  const currentLabelId = searchParams.get("labelId") || undefined;
  const currentCategoryId = searchParams.get("categoryId") || undefined;

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
