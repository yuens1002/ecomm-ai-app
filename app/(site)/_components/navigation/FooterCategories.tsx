"use client";

import { CategoryMenuColumns } from "./CategoryMenuColumns";
import { DynamicIcon } from "@/components/shared/icons/DynamicIcon";

interface Category {
  name: string;
  slug: string;
}

interface FooterCategoriesProps {
  categoryGroups: Record<string, Category[]>;
  labelIcons?: Record<string, string>;
  heading?: string;
  productMenuIcon?: string;
  productMenuText?: string;
}

export default function FooterCategories({
  categoryGroups,
  labelIcons,
  heading,
  productMenuIcon = "ShoppingBag",
  productMenuText = "Shop",
}: FooterCategoriesProps) {
  const title = productMenuText ?? heading ?? "Shop";
  const icon = productMenuIcon ?? "ShoppingBag";
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <DynamicIcon name={icon} className="w-5 h-5" />
        {title}
      </h3>

      {/* Use self-balancing CategoryMenuColumns component */}
      <CategoryMenuColumns
        categoryGroups={categoryGroups}
        labelIcons={labelIcons}
      />
    </div>
  );
}
