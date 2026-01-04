"use client";

import { useState, useMemo } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ACTION_BAR_CONFIG } from "../../../constants/action-bar-config";
import { useProductMenu } from "../../../ProductMenuProvider";
import {
  executeAction,
  type ActionContext,
} from "../../../constants/action-strategies";
import type { MenuProduct } from "../../../types/menu";
import { ActionButton } from "./ActionButton";
import { ActionComboButton } from "./ActionComboButton";
import { ActionDropdownButton } from "./ActionDropdownButton";

/**
 * Filter products by search term (case-insensitive)
 */
export function filterProductsBySearch(
  products: MenuProduct[],
  search: string
): MenuProduct[] {
  return products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );
}

/**
 * Section products into Added, Unassigned, and Available groups
 * Each section is sorted alphabetically
 */
export function sectionProducts(
  products: MenuProduct[],
  currentCategoryId: string
) {
  const addedProducts = products
    .filter((p) => p.categoryIds.includes(currentCategoryId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const unassignedProducts = products
    .filter((p) => p.categoryIds.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const availableProducts = products
    .filter(
      (p) =>
        !p.categoryIds.includes(currentCategoryId) && p.categoryIds.length > 0
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return { addedProducts, unassignedProducts, availableProducts };
}

/**
 * MenuActionBar - Action buttons for current view
 *
 * Gets all data from ProductMenuProvider - no props needed.
 */
export function MenuActionBar() {
  const {
    builder,
    labels,
    categories,
    products,
    mutate,
    // All mutations
    updateLabel,
    updateCategory,
    attachCategory,
    detachCategory,
    detachProductFromCategory,
    attachProductToCategory,
  } = useProductMenu();

  const actions = ACTION_BAR_CONFIG[builder.currentView];
  const leftActions = actions.filter((a) => a.position === "left");
  const rightActions = actions.filter((a) => a.position === "right");

  // Search state for products dropdown
  const [productSearch, setProductSearch] = useState("");

  // Build state object for action bar config (with data counts)
  const state = useMemo(
    () => ({
      ...builder,
      totalLabels: labels.length,
      totalCategories: categories.length,
      totalProducts: products.length,
    }),
    [builder, labels.length, categories.length, products.length]
  );

  // Build actions object for action bar config
  const builderActions = useMemo(
    () => ({
      // Selection
      toggleSelection: builder.toggleSelection,
      selectAll: builder.selectAll,
      clearSelection: builder.clearSelection,

      // Expand/collapse
      toggleExpand: builder.toggleExpand,
      expandAll: builder.expandAll,
      collapseAll: builder.collapseAll,

      // Navigation
      navigateToView: builder.navigateToView,
      navigateToLabel: builder.navigateToLabel,
      navigateToCategory: builder.navigateToCategory,
      navigateBack: builder.navigateBack,

      // Undo/redo (stubs for now)
      undo: () => console.log("[MenuActionBar] Undo not yet implemented"),
      redo: () => console.log("[MenuActionBar] Redo not yet implemented"),

      // CRUD operations
      removeSelected: async () => {
        if (builder.selectedIds.length === 0) return;

        const context: ActionContext = {
          selectedIds: builder.selectedIds,
          currentLabelId: builder.currentLabelId,
          currentCategoryId: builder.currentCategoryId,
          mutations: {
            updateLabel,
            updateCategory,
            detachCategory,
            detachProductFromCategory,
          },
          labels,
          categories,
          products,
        };

        const result = await executeAction(
          "remove",
          builder.currentView,
          context,
          {
            labels: mutate,
            categories: mutate,
          }
        );

        if (!result.ok) {
          console.error("[MenuActionBar] Remove failed:", result.error);
        }

        builder.clearSelection();
      },
      cloneSelected: async () => {
        console.log("[MenuActionBar] Clone not yet implemented");
      },
      toggleVisibility: async () => {
        if (builder.selectedIds.length === 0) return;

        const context: ActionContext = {
          selectedIds: builder.selectedIds,
          currentLabelId: builder.currentLabelId,
          currentCategoryId: builder.currentCategoryId,
          mutations: {
            updateLabel,
            updateCategory,
            detachCategory,
            detachProductFromCategory,
          },
          labels,
          categories,
          products,
        };

        const result = await executeAction(
          "toggleVisibility",
          builder.currentView,
          context,
          {
            labels: mutate,
            categories: mutate,
          }
        );

        if (!result.ok) {
          console.error(
            "[MenuActionBar] Toggle visibility failed:",
            result.error
          );
        }

        builder.clearSelection();
      },
    }),
    [
      builder,
      labels,
      categories,
      products,
      mutate,
      updateLabel,
      updateCategory,
      detachCategory,
      detachProductFromCategory,
    ]
  );

  // Helper to get dropdown content for "Add existing" actions
  const getAddExistingDropdownContent = (actionId: string) => {
    switch (actionId) {
      case "add-labels": {
        // Menu view: Add existing labels to menu
        // Show all available labels with checkbox for isVisible (menu visibility)
        if (!labels || labels.length === 0) return null;

        return (
          <div className="max-h-64 overflow-y-auto overflow-x-hidden">
            {labels.map((label) => (
              <DropdownMenuCheckboxItem
                key={label.id}
                checked={label.isVisible}
                onCheckedChange={async (checked) => {
                  console.log(
                    "[Add Labels] Toggling label:",
                    label.name,
                    "to",
                    checked
                  );
                  try {
                    const result = await updateLabel(label.id, {
                      isVisible: checked,
                    });
                    console.log(
                      "[Add Labels] Toggle complete, result:",
                      result
                    );
                  } catch (error) {
                    console.error("[Add Labels] Error updating label:", error);
                  }
                }}
              >
                <span className="truncate">{label.name}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        );
      }

      case "add-categories": {
        // Label view: Add existing categories to current label
        if (!state.currentLabelId) return null;
        if (!labels || !categories || categories.length === 0) return null;

        const currentLabel = labels.find((l) => l.id === state.currentLabelId);
        if (!currentLabel) return null;

        return (
          <div className="max-h-64 overflow-y-auto overflow-x-hidden">
            {categories.map((category) => {
              const isAttached = currentLabel.categories.some(
                (c) => c.id === category.id
              );
              return (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={isAttached}
                  onCheckedChange={async (checked) => {
                    console.log(
                      "[Add Categories] Toggling category:",
                      category.name,
                      "to",
                      checked
                    );
                    try {
                      if (checked) {
                        const result = await attachCategory(
                          state.currentLabelId!,
                          category.id
                        );
                        console.log("[Add Categories] Attach result:", result);
                      } else {
                        const result = await detachCategory(
                          state.currentLabelId!,
                          category.id
                        );
                        console.log("[Add Categories] Detach result:", result);
                      }
                    } catch (error) {
                      console.error("[Add Categories] Error:", error);
                    }
                  }}
                >
                  <span className="truncate">{category.name}</span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </div>
        );
      }

      case "add-products": {
        // Category view: Add existing products to current category
        if (!state.currentCategoryId) return null;
        if (!products || products.length === 0) return null;

        const filteredProducts = filterProductsBySearch(
          products,
          productSearch
        );
        const { addedProducts, unassignedProducts, availableProducts } =
          sectionProducts(filteredProducts, state.currentCategoryId);

        const renderProductItem = (product: MenuProduct) => {
          const isAttached = product.categoryIds.includes(
            state.currentCategoryId!
          );

          return (
            <DropdownMenuCheckboxItem
              key={product.id}
              onSelect={(e) => e.preventDefault()}
              checked={isAttached}
              onCheckedChange={async (checked) => {
                console.log(
                  "[Add Products]",
                  checked ? "Attaching" : "Detaching",
                  "product:",
                  product.name
                );
                try {
                  if (checked) {
                    const result = await attachProductToCategory(
                      product.id,
                      state.currentCategoryId!
                    );
                    console.log("[Add Products] Attach result:", result);
                  } else {
                    const result = await detachProductFromCategory(
                      product.id,
                      state.currentCategoryId!
                    );
                    console.log("[Add Products] Detach result:", result);
                  }
                } catch (error) {
                  console.error("[Add Products] Error:", error);
                }
              }}
            >
              <span className="truncate">{product.name}</span>
            </DropdownMenuCheckboxItem>
          );
        };

        return (
          <>
            <div className="px-2 py-2 border-b sticky top-0 bg-popover z-10">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 h-9"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto overflow-x-hidden">
              {filteredProducts.length === 0 ? (
                <div className="px-2 py-6 text-sm text-center text-muted-foreground">
                  No products found
                </div>
              ) : (
                <>
                  {addedProducts.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                        Added
                      </DropdownMenuLabel>
                      {addedProducts.map(renderProductItem)}
                    </>
                  )}

                  {unassignedProducts.length > 0 && (
                    <>
                      {addedProducts.length > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                        Unassigned
                      </DropdownMenuLabel>
                      {unassignedProducts.map(renderProductItem)}
                    </>
                  )}

                  {availableProducts.length > 0 && (
                    <>
                      {(addedProducts.length > 0 ||
                        unassignedProducts.length > 0) && (
                        <DropdownMenuSeparator />
                      )}
                      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                        Available
                      </DropdownMenuLabel>
                      {availableProducts.map(renderProductItem)}
                    </>
                  )}
                </>
              )}
            </div>
          </>
        );
      }

      default:
        return null;
    }
  };

  const renderAction = (action: (typeof actions)[0], index: number) => {
    const isDisabled = action.disabled(state);
    const prevAction = index > 0 ? leftActions[index - 1] : null;
    const isAfterCombo = prevAction?.type === "combo";

    switch (action.type) {
      case "combo": {
        // Only render if this is the "new" action (to avoid duplicates)
        if (!action.id.startsWith("new-")) return null;

        const addAction = leftActions.find((a) => a.id === action.comboWith);
        if (!addAction) return null;

        const dropdownContent = getAddExistingDropdownContent(addAction.id);

        return (
          <ActionComboButton
            key={`combo-${action.id}`}
            newButton={{
              icon: action.icon,
              label: action.label,
              tooltip: action.tooltip,
              kbd: action.kbd,
              disabled: isDisabled,
              ariaLabel: action.ariaLabel?.(state),
              onClick: () => action.onClick(state, builderActions),
            }}
            addButton={{
              label: addAction.label,
              tooltip: addAction.tooltip,
              disabled: addAction.disabled(state),
              dropdownContent: dropdownContent || (
                <div className="p-4 text-sm text-muted-foreground">
                  {addAction.label} dropdown content
                </div>
              ),
            }}
          />
        );
      }

      case "dropdown": {
        const dropdownContent = getAddExistingDropdownContent(action.id);

        return (
          <ActionDropdownButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            tooltip={action.tooltip}
            kbd={action.kbd}
            disabled={isDisabled}
            ariaLabel={action.ariaLabel?.(state)}
            dropdownContent={
              dropdownContent || (
                <div className="p-4 text-sm text-muted-foreground">
                  {action.label} options
                </div>
              )
            }
          />
        );
      }

      case "button":
      default: {
        return (
          <div key={action.id} className={isAfterCombo ? "ml-2" : ""}>
            <ActionButton
              icon={action.icon}
              label={action.label}
              tooltip={action.tooltip}
              kbd={action.kbd}
              disabled={isDisabled}
              ariaLabel={action.ariaLabel?.(state)}
              onClick={() => action.onClick(state, builderActions)}
            />
          </div>
        );
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-4 px-0 bg-background">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-2">
          {leftActions.map((action, index) => renderAction(action, index))}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">
          {rightActions.map(renderAction)}
        </div>
      </div>
    </TooltipProvider>
  );
}
