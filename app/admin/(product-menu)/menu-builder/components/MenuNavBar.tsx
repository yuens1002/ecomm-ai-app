"use client";

import { useRouter } from "next/navigation";
import { NavItem } from "./NavItem";
import { useProductMenu } from "../../ProductMenuProvider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { ViewType } from "../../types/builder-state";

interface MenuNavBarProps {
  currentView: ViewType;
  currentLabelId?: string;
  currentCategoryId?: string;
}

/**
 * MenuNavBar - Navigation breadcrumb with 3 segments (Menu | Labels | Categories)
 *
 * Uses URL params for state persistence:
 * - /admin/menu-builder?view=menu
 * - /admin/menu-builder?view=label&labelId=123
 * - /admin/menu-builder?view=category&categoryId=456
 */
export function MenuNavBar({
  currentView,
  currentLabelId,
  currentCategoryId,
}: MenuNavBarProps) {
  const router = useRouter();
  const { labels, categories, settings, isLoading } = useProductMenu();

  // Menu segment: use settings from provider (which already has defaults applied)
  const menuIcon = settings?.icon || "";
  const menuText = settings?.title || "";

  // Find current label/category for display
  const currentLabel = labels.find((l) => l.id === currentLabelId);
  const currentCategory = categories.find((c) => c.id === currentCategoryId);

  // Navigation helpers
  const navigate = (view: ViewType, labelId?: string, categoryId?: string) => {
    const params = new URLSearchParams();
    params.set("view", view);
    if (labelId) params.set("labelId", labelId);
    if (categoryId) params.set("categoryId", categoryId);
    router.push(`/admin/menu-builder?${params}`);
  };

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

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="flex items-center gap-4 mb-4 pb-3 border-b">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 mb-4 pb-3 border-b">
      {/* Menu segment */}
      <NavItem
        icon={menuIcon}
        text={menuText}
        isSelected={currentView === "menu"}
        hasDropdown={false}
        onClick={() => navigate("menu")}
      />

      {/* Labels segment */}
      <NavItem
        icon="Tags"
        text={labelsText}
        isSelected={currentView === "label" || currentView === "all-labels"}
        hasDropdown
      >
        <DropdownMenuItem onClick={() => navigate("all-labels")}>
          All labels
        </DropdownMenuItem>
        {labels.length > 0 && <DropdownMenuSeparator />}
        {labels.map((label) => (
          <DropdownMenuItem
            key={label.id}
            onClick={() => navigate("label", label.id)}
          >
            {label.name}
          </DropdownMenuItem>
        ))}
      </NavItem>

      {/* Categories segment */}
      <NavItem
        icon="FileSpreadsheet"
        text={categoriesText}
        isSelected={
          currentView === "category" || currentView === "all-categories"
        }
        hasDropdown
      >
        <DropdownMenuItem onClick={() => navigate("all-categories")}>
          All categories
        </DropdownMenuItem>
        {categories.length > 0 && <DropdownMenuSeparator />}
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => navigate("category", undefined, category.id)}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </NavItem>
    </div>
  );
}
