import { Control, FieldValues } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { FormCard } from "@/components/ui/app/FormCard";

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

type ProductCategoriesSectionProps = {
  control: Control<FieldValues>;
  categories: Category[];
};

export function ProductCategoriesSection({
  control,
  categories,
}: ProductCategoriesSectionProps) {
  // Group categories by their labels (many-to-many relationship)
  // Deduplicate: show each category only once under its first (lowest order) label
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

  // Sort label groups by label order
  const sortedLabelGroups = Array.from(labelGroups.values())
    .sort((a, b) => a.labelOrder - b.labelOrder)
    .map((group) => {
      // Deduplicate categories within this label group first
      const seenIds = new Set<string>();
      const uniqueCategories = group.categories.filter(({ category }) => {
        if (seenIds.has(category.id)) return false;
        seenIds.add(category.id);
        return true;
      });

      // Sort by order within the label
      uniqueCategories.sort((a, b) => a.order - b.order);

      return { ...group, categories: uniqueCategories };
    })
    .map((group) => {
      // Deduplicate across labels: filter out categories already shown in earlier labels
      const filteredCategories = group.categories.filter(({ category }) => {
        if (displayedCategoryIds.has(category.id)) return false;
        displayedCategoryIds.add(category.id);
        return true;
      });

      return { ...group, categories: filteredCategories };
    })
    .filter((group) => group.categories.length > 0); // Remove empty label groups

  return (
    <FormCard>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Categories</h3>
        <p className="text-sm text-muted-foreground">
          Assign this product to one or more categories for filtering and
          navigation
        </p>
      </div>
      <FormField
        control={control}
        name="categoryIds"
        render={({ fieldState }) => (
          <Field className="mt-4">
            {sortedLabelGroups.map((group, groupIndex) => (
              <div
                key={group.labelName}
                className={groupIndex > 0 ? "mt-6" : ""}
              >
                <h4 className="text-sm font-medium mb-3">{group.labelName}</h4>
                <ul className="flex flex-row flex-wrap gap-4 list-none">
                  {group.categories.map(({ category: cat }) => (
                    <li key={cat.id} className="inline-block">
                      <FormField
                        control={control}
                        name="categoryIds"
                        render={({ field }) => (
                          <Field orientation="horizontal" className="w-auto">
                            <Checkbox
                              checked={field.value?.includes(cat.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...(field.value || []),
                                      cat.id,
                                    ])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== cat.id
                                      )
                                    );
                              }}
                            />
                            <FieldLabel className="font-normal cursor-pointer">
                              {cat.name}
                            </FieldLabel>
                          </Field>
                        )}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {unlabeledCategories.length > 0 && (
              <div className={sortedLabelGroups.length > 0 ? "mt-6" : ""}>
                <h4 className="text-sm font-medium mb-3">Unlabeled*</h4>
                <ul className="flex flex-row flex-wrap gap-4 list-none">
                  {unlabeledCategories.map((cat) => (
                    <li key={cat.id} className="inline-block">
                      <FormField
                        control={control}
                        name="categoryIds"
                        render={({ field }) => (
                          <Field orientation="horizontal" className="w-auto">
                            <Checkbox
                              checked={field.value?.includes(cat.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...(field.value || []),
                                      cat.id,
                                    ])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== cat.id
                                      )
                                    );
                              }}
                            />
                            <FieldLabel className="font-normal cursor-pointer">
                              {cat.name}
                            </FieldLabel>
                          </Field>
                        )}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FormCard>
  );
}
