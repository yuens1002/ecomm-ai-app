import { DropdownContent } from "./DropdownContent";
import type { MenuLabel } from "../../../types/menu";

type AddLabelsDropdownProps = {
  labels: MenuLabel[];
  updateLabel: (
    id: string,
    data: { isVisible: boolean }
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
};

/**
 * Dropdown for adding/removing labels from menu (menu view)
 */
export function AddLabelsDropdown({
  labels,
  updateLabel,
}: AddLabelsDropdownProps) {
  if (!labels || labels.length === 0) return null;

  return (
    <DropdownContent
      sections={[
        {
          items: labels.map((label) => ({
            id: label.id,
            name: label.name,
            checked: label.isVisible,
          })),
        },
      ]}
      onItemToggle={async (labelId, checked) => {
        console.log("[Add Labels] Toggling label:", labelId, "to", checked);
        try {
          const result = await updateLabel(labelId, { isVisible: checked });
          console.log("[Add Labels] Toggle complete, result:", result);
        } catch (error) {
          console.error("[Add Labels] Error updating label:", error);
        }
      }}
      emptyMessage="No labels available"
    />
  );
}
