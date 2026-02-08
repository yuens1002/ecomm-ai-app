"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  FieldDescription,
  Field,
  FieldLabel,
} from "@/components/ui/field";

interface CategoryLabel {
  id: string;
  name: string;
  icon: string | null;
  order: number;
}

interface Category {
  id: string;
  name: string;
  labels: CategoryLabel[];
}

interface CategoriesSectionProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CategoriesSection({
  categories,
  selectedIds,
  onChange,
}: CategoriesSectionProps) {
  // Group categories by their labels (reuse existing grouping logic)
  type LabelGroup = {
    labelName: string;
    labelOrder: number;
    categories: { category: Category; order: number }[];
  };

  const labelGroups = new Map<string, LabelGroup>();
  const unlabeledCategories: Category[] = [];
  const displayedCategoryIds = new Set<string>();

  categories.forEach((cat) => {
    if (cat.labels.length === 0) {
      unlabeledCategories.push(cat);
    } else {
      cat.labels.forEach((labelEntry) => {
        const labelId = labelEntry.id;
        if (!labelGroups.has(labelId)) {
          labelGroups.set(labelId, {
            labelName: labelEntry.name,
            labelOrder: labelEntry.order,
            categories: [],
          });
        }
        labelGroups.get(labelId)!.categories.push({
          category: cat,
          order: labelEntry.order,
        });
      });
    }
  });

  const sortedLabelGroups = Array.from(labelGroups.values())
    .sort((a, b) => a.labelOrder - b.labelOrder)
    .map((group) => {
      const seenIds = new Set<string>();
      const uniqueCategories = group.categories.filter(({ category }) => {
        if (seenIds.has(category.id)) return false;
        seenIds.add(category.id);
        return true;
      });
      uniqueCategories.sort((a, b) => a.order - b.order);
      return { ...group, categories: uniqueCategories };
    })
    .map((group) => {
      const filteredCategories = group.categories.filter(({ category }) => {
        if (displayedCategoryIds.has(category.id)) return false;
        displayedCategoryIds.add(category.id);
        return true;
      });
      return { ...group, categories: filteredCategories };
    })
    .filter((group) => group.categories.length > 0);

  const toggleCategory = (catId: string) => {
    if (selectedIds.includes(catId)) {
      onChange(selectedIds.filter((id) => id !== catId));
    } else {
      onChange([...selectedIds, catId]);
    }
  };

  return (
    <FieldSet>
      <FieldLegend>Categories</FieldLegend>
      <FieldDescription>
        Assign to categories for filtering and navigation
      </FieldDescription>

      <FieldGroup>
        {sortedLabelGroups.map((group) => (
          <div key={group.labelName}>
            <h4 className="text-sm font-medium mb-3">{group.labelName}</h4>
            <div className="flex flex-row flex-wrap gap-4">
              {group.categories.map(({ category: cat }) => (
                <Field key={cat.id} orientation="horizontal" className="w-auto">
                  <Checkbox
                    checked={selectedIds.includes(cat.id)}
                    onCheckedChange={() => toggleCategory(cat.id)}
                  />
                  <FieldLabel className="font-normal cursor-pointer">
                    {cat.name}
                  </FieldLabel>
                </Field>
              ))}
            </div>
          </div>
        ))}
        {unlabeledCategories.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Other</h4>
            <div className="flex flex-row flex-wrap gap-4">
              {unlabeledCategories.map((cat) => (
                <Field key={cat.id} orientation="horizontal" className="w-auto">
                  <Checkbox
                    checked={selectedIds.includes(cat.id)}
                    onCheckedChange={() => toggleCategory(cat.id)}
                  />
                  <FieldLabel className="font-normal cursor-pointer">
                    {cat.name}
                  </FieldLabel>
                </Field>
              ))}
            </div>
          </div>
        )}
        {categories.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded">
            No categories available.
          </div>
        )}
      </FieldGroup>
    </FieldSet>
  );
}
