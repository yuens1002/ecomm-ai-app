"use client";

import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ACTION_BAR_CONFIG } from "../../../constants/action-bar-config";
import type { BuilderState, ViewType } from "../../../types/builder-state";
import type { MenuLabel, MenuCategory, MenuProduct } from "../../../types/menu";
import { ActionButton } from "./ActionButton";
import { ActionComboButton } from "./ActionComboButton";
import { ActionDropdownButton } from "./ActionDropdownButton";
import { useProductMenuMutations } from "../../../hooks/useProductMenuMutations";

type MenuActionBarProps = {
  view: ViewType;
  state: BuilderState;
  labels: MenuLabel[];
  categories: MenuCategory[];
  products?: MenuProduct[];
};

export function MenuActionBar({
  view,
  state,
  labels,
  categories,
  products = [],
}: MenuActionBarProps) {
  const actions = ACTION_BAR_CONFIG[view];
  const leftActions = actions.filter((a) => a.position === "left");
  const rightActions = actions.filter((a) => a.position === "right");
  const mutations = useProductMenuMutations();

  // Search state for products dropdown
  const [productSearch, setProductSearch] = useState("");

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
                    const result = await mutations.updateLabel(label.id, {
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
                        const result = await mutations.attachCategory(
                          state.currentLabelId!,
                          category.id
                        );
                        console.log("[Add Categories] Attach result:", result);
                      } else {
                        const result = await mutations.detachCategory(
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

        const filteredProducts = products.filter((product) =>
          product.name.toLowerCase().includes(productSearch.toLowerCase())
        );

        // Group products into sections
        const addedProducts = filteredProducts
          .filter((p) => p.categoryIds.includes(state.currentCategoryId!))
          .sort((a, b) => a.name.localeCompare(b.name));

        const unassignedProducts = filteredProducts
          .filter((p) => p.categoryIds.length === 0)
          .sort((a, b) => a.name.localeCompare(b.name));

        const availableProducts = filteredProducts
          .filter(
            (p) =>
              !p.categoryIds.includes(state.currentCategoryId!) &&
              p.categoryIds.length > 0
          )
          .sort((a, b) => a.name.localeCompare(b.name));

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
                    const result = await mutations.attachProductToCategory(
                      product.id,
                      state.currentCategoryId!
                    );
                    console.log("[Add Products] Attach result:", result);
                  } else {
                    const result = await mutations.detachProductFromCategory(
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
              onClick: () => action.onClick(state),
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
              onClick={() => action.onClick(state)}
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
