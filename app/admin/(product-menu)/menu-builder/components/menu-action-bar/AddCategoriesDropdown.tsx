import { DropdownContent } from "./DropdownContent";
import type { MenuLabel, MenuCategory } from "../../../types/menu";

type AddCategoriesDropdownProps = {
  currentLabelId: string;
  labels: MenuLabel[];
  categories: MenuCategory[];
  attachCategory: (labelId: string, categoryId: string) => Promise<any>;
  detachCategory: (labelId: string, categoryId: string) => Promise<any>;
};

/**
 * Dropdown for adding/removing categories from label (label view)
 */
export function AddCategoriesDropdown({
  currentLabelId,
  labels,
  categories,
  attachCategory,
  detachCategory,
}: AddCategoriesDropdownProps) {
  if (!labels || !categories || categories.length === 0) return null;

  const currentLabel = labels.find((l) => l.id === currentLabelId);
  if (!currentLabel) return null;

  return (
    <DropdownContent
      sections={[
        {
          items: categories.map((category) => {
            const isAttached = currentLabel.categories.some(
              (c) => c.id === category.id
            );
            return {
              id: category.id,
              name: category.name,
              checked: isAttached,
            };
          }),
        },
      ]}
      onItemToggle={async (categoryId, checked) => {
        console.log(
          "[Add Categories] Toggling category:",
          categoryId,
          "to",
          checked
        );
        try {
          if (checked) {
            const result = await attachCategory(currentLabelId, categoryId);
            console.log("[Add Categories] Attach result:", result);
          } else {
            const result = await detachCategory(currentLabelId, categoryId);
            console.log("[Add Categories] Detach result:", result);
          }
        } catch (error) {
          console.error("[Add Categories] Error:", error);
        }
      }}
      emptyMessage="No categories available"
    />
  );
}
