"use client";

import { CategoryMenuColumns } from "./CategoryMenuColumns";

interface Category {
  name: string;
  slug: string;
}

interface FooterCategoriesProps {
  categoryGroups: Record<string, Category[]>;
  labelIcons?: Record<string, string>;
  heading?: string;
}

export default function FooterCategories({
  categoryGroups,
  labelIcons,
  heading = "Coffee Selection",
}: FooterCategoriesProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{heading}</h3>

      {/* Use self-balancing CategoryMenuColumns component */}
      <CategoryMenuColumns
        categoryGroups={categoryGroups}
        labelIcons={labelIcons}
      />
    </div>
  );
}
