"use client";

import { useState } from "react";
import Link from "next/link";

interface Category {
  name: string;
  slug: string;
}

interface FooterCategoriesProps {
  categoryGroups: Record<string, Category[]>;
  heading?: string;
}

function CategoryGroup({
  label,
  categories,
}: {
  label: string;
  categories: Category[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const LIMIT = 7;
  const hasMore = categories.length > LIMIT;
  const visibleCategories = isExpanded
    ? categories
    : categories.slice(0, LIMIT);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
        {label}
      </h4>
      <ul className="space-y-1">
        {visibleCategories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/${category.slug}`}
              className="text-sm hover:underline hover:text-primary transition-colors"
            >
              {category.name}
            </Link>
          </li>
        ))}
        {hasMore && (
          <li>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-primary hover:underline"
            >
              {isExpanded ? "...less" : "...more"}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

export default function FooterCategories({
  categoryGroups,
  heading = "Coffee Selection",
}: FooterCategoriesProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{heading}</h3>

      {/* 3-column grid of label groups */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-4">
        {Object.entries(categoryGroups).map(([label, categories]) => (
          <CategoryGroup key={label} label={label} categories={categories} />
        ))}
      </div>
    </div>
  );
}
