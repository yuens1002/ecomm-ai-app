import { useState, useMemo } from "react";
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
 * Filter labels by search term (case-insensitive)
 */
function filterLabelsBySearch(
  labels: MenuLabel[],
  search: string
): MenuLabel[] {
  if (!search.trim()) return labels;
  return labels.filter((label) =>
    label.name.toLowerCase().includes(search.toLowerCase())
  );
}

/**
 * Section labels into Added (visible) and Available (not visible) groups
 * Each section is sorted alphabetically
 */
function sectionLabels(labels: MenuLabel[]) {
  const addedLabels = labels
    .filter((l) => l.isVisible)
    .sort((a, b) => a.name.localeCompare(b.name));

  const availableLabels = labels
    .filter((l) => !l.isVisible)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { addedLabels, availableLabels };
}

/**
 * Dropdown for adding/removing labels from menu (menu view)
 */
export function AddLabelsDropdown({
  labels,
  updateLabel,
}: AddLabelsDropdownProps) {
  const [labelSearch, setLabelSearch] = useState("");

  const filteredLabels = useMemo(
    () => filterLabelsBySearch(labels, labelSearch),
    [labels, labelSearch]
  );

  const { addedLabels, availableLabels } = useMemo(
    () => sectionLabels(filteredLabels),
    [filteredLabels]
  );

  if (!labels || labels.length === 0) return null;

  return (
    <DropdownContent
      searchable
      searchPlaceholder="Search labels..."
      searchValue={labelSearch}
      onSearchChange={setLabelSearch}
      sections={[
        {
          label: "Added",
          items: addedLabels.map((label) => ({
            id: label.id,
            name: label.name,
            checked: true,
          })),
        },
        {
          label: "Available",
          items: availableLabels.map((label) => ({
            id: label.id,
            name: label.name,
            checked: false,
          })),
        },
      ]}
      onItemToggle={async (labelId, checked) => {
        try {
          await updateLabel(labelId, { isVisible: checked });
        } catch (error) {
          console.error("[Add Labels] Error updating label:", error);
        }
      }}
      emptyMessage="No labels found"
    />
  );
}
