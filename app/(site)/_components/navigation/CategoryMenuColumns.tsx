"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DynamicIcon } from "@/components/shared/icons/DynamicIcon";

interface Category {
  name: string;
  slug: string;
}

interface LabelGroup {
  label: string;
  icon?: string | null;
  categories: Category[];
}

interface CategoryMenuColumnsProps {
  categoryGroups: Record<string, Category[]>;
  /** Optional icons for labels: { "Label Name": "IconName" } */
  labelIcons?: Record<string, string | null>;
  /** Maximum categories to show per label before "...more" link */
  maxInitialCategories?: number;
  /** Custom class for the container */
  className?: string;
  /** Link component className */
  linkClassName?: string;
  /** Label header className */
  labelClassName?: string;
}

/**
 * Renders a single label group with its categories.
 * Handles expand/collapse for labels with > maxInitial categories.
 */
function LabelGroupItem({
  labelGroup,
  isExpanded,
  onToggle,
  maxInitial,
  linkClassName,
  labelClassName,
}: {
  labelGroup: LabelGroup;
  isExpanded: boolean;
  onToggle: () => void;
  maxInitial: number;
  linkClassName: string;
  labelClassName: string;
}) {
  const { label, icon, categories } = labelGroup;
  const hasMore = categories.length > maxInitial;
  const visibleCategories = isExpanded
    ? categories
    : categories.slice(0, maxInitial);

  return (
    // break-inside-avoid keeps each label group together in one column
    <div className="break-inside-avoid space-y-3 mb-6">
      {/* Label Header with optional icon */}
      <div className="flex items-center gap-2 sm:border-b sm:pb-2">
        {icon && <DynamicIcon name={icon} className="h-4 w-4 shrink-0" />}
        <h4 className={labelClassName}>{label}</h4>
      </div>

      {/* Category Links */}
      <ul className="space-y-1">
        {visibleCategories.map((category) => (
          <li key={category.slug} className="truncate">
            <Link href={`/${category.slug}`} className={linkClassName}>
              {category.name}
            </Link>
          </li>
        ))}

        {/* ...more / ...less link */}
        {hasMore && (
          <li>
            <button
              onClick={onToggle}
              className="text-sm text-primary hover:underline truncate"
              aria-expanded={isExpanded}
              aria-label={`Show ${isExpanded ? "less" : "more"} categories in ${label}`}
            >
              {isExpanded ? "...less" : "...more"}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

/**
 * Responsive category menu with column-based layout.
 *
 * Features:
 * - Items flow top-to-bottom within each column, then to next column
 * - CSS multi-column automatically balances heights across columns
 * - Consistent column-first reading order at all breakpoints
 * - Each label can show up to `maxInitialCategories` (default 7) before "...more"
 * - Clicking "...more" expands that label inline
 *
 * Layout:
 * - Mobile (< 640px): 1 column
 * - Tablet (640px+): 2 columns
 * - Desktop (1024px+): 3 columns
 *
 * Reading order example with labels A, B, C, D, E, F:
 * - 3 cols: A D / B E / C F (column 1, column 2, column 3)
 * - 2 cols: A C E / B D F
 * - 1 col:  A / B / C / D / E / F
 *
 * Use cases: Header navigation, Footer navigation
 */
export function CategoryMenuColumns({
  categoryGroups,
  labelIcons,
  maxInitialCategories = 7,
  className = "columns-1 sm:columns-2 lg:columns-3 gap-x-6",
  linkClassName = "text-sm hover:underline hover:text-primary transition-colors truncate block",
  labelClassName = "text-xs font-bold uppercase tracking-wider text-muted-foreground truncate",
}: CategoryMenuColumnsProps) {
  // Track which labels are expanded (label name -> boolean)
  const [expandedLabels, setExpandedLabels] = useState<Map<string, boolean>>(
    new Map()
  );

  // Convert categoryGroups object to ordered array of LabelGroups
  const labelGroups = useMemo(
    () =>
      Object.entries(categoryGroups).map(([label, categories]) => ({
        label,
        icon: labelIcons?.[label] ?? null,
        categories,
      })),
    [categoryGroups, labelIcons]
  );

  const toggleLabel = (labelName: string) => {
    setExpandedLabels((prev) => {
      const next = new Map(prev);
      next.set(labelName, !prev.get(labelName));
      return next;
    });
  };

  return (
    <div className={className}>
      {/*
        CSS multi-column layout fills columns top-to-bottom:
        - Items flow down column 1, then column 2, then column 3
        - Automatic height balancing across columns
        - break-inside-avoid on items prevents label groups from splitting
      */}
      {labelGroups.map((group) => (
        <LabelGroupItem
          key={group.label}
          labelGroup={group}
          isExpanded={expandedLabels.get(group.label) ?? false}
          onToggle={() => toggleLabel(group.label)}
          maxInitial={maxInitialCategories}
          linkClassName={linkClassName}
          labelClassName={labelClassName}
        />
      ))}
    </div>
  );
}
