"use client";

import { NavItem } from "./NavItem";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useMenuBuilder } from "../MenuBuilderProvider";

/**
 * MenuNavBar - Navigation breadcrumb with 3 segments (Categories | Labels | Menu)
 *
 * Gets all data from ProductMenuProvider - no props needed.
 * State is persisted in URL params via builder.currentView, etc.
 */
export function MenuNavBar() {
  const {
    builder: {
      currentView,
      currentLabelId,
      currentCategoryId,
      navigateToView,
      navigateToLabel,
      navigateToCategory,
    },
    labels,
    categories,
    settings,
    isLoading,
  } = useMenuBuilder();

  if (isLoading) {
    return (
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  // Find current label/category for display
  const currentLabel = labels.find((l) => l.id === currentLabelId);
  const currentCategory = categories.find((c) => c.id === currentCategoryId);

  const menuIcon = settings?.icon; // Only show if admin has set one
  const menuText = settings?.title;

  // Labels segment text
  const labelsText =
    currentView === "all-labels"
      ? "All labels"
      : currentView === "label" && currentLabel
        ? currentLabel.name
        : "Labels";

  // Categories segment text
  const categoriesText =
    currentView === "all-categories"
      ? "All categories"
      : currentView === "category" && currentCategory
        ? currentCategory.name
        : "Categories";

  return (
    <div className="flex items-center gap-4 mb-4 pb-3 border-b">
      {/* Categories segment */}
      <NavItem
        icon="FileSpreadsheet"
        text={categoriesText}
        isSelected={
          currentView === "category" || currentView === "all-categories"
        }
        hasDropdown
      >
        <DropdownMenuItem onClick={() => navigateToView("all-categories")}>
          All categories
        </DropdownMenuItem>
        {categories.length > 0 && <DropdownMenuSeparator />}
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => navigateToCategory(category.id)}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </NavItem>

      {/* Labels segment */}
      <NavItem
        icon="Tags"
        text={labelsText}
        isSelected={currentView === "label" || currentView === "all-labels"}
        hasDropdown
      >
        <DropdownMenuItem onClick={() => navigateToView("all-labels")}>
          All labels
        </DropdownMenuItem>
        {labels.length > 0 && <DropdownMenuSeparator />}
        {labels.map((label) => (
          <DropdownMenuItem
            key={label.id}
            onClick={() => navigateToLabel(label.id)}
          >
            {label.name}
          </DropdownMenuItem>
        ))}
      </NavItem>

      {/* Menu segment */}
      <NavItem
        icon={menuIcon}
        text={menuText}
        isSelected={currentView === "menu"}
        hasDropdown={false}
        onClick={() => navigateToView("menu")}
      />
    </div>
  );
}
