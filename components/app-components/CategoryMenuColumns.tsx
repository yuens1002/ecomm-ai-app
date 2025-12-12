"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DynamicIcon } from "./DynamicIcon";

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

interface ColumnDistribution {
  column1: LabelGroup[];
  column2: LabelGroup[];
  column3: LabelGroup[];
}

/**
 * Calculate the "weight" (number of visible items) for a label group.
 * Weight = 1 (for label header) + number of visible categories
 */
function calculateLabelWeight(
  labelGroup: LabelGroup,
  isExpanded: boolean,
  maxInitial: number
): number {
  const visibleCount = isExpanded
    ? labelGroup.categories.length
    : Math.min(labelGroup.categories.length, maxInitial);

  // 1 for label header + visible categories + 1 for "...more/less" if applicable
  const hasMoreLink = labelGroup.categories.length > maxInitial || isExpanded;
  return 1 + visibleCount + (hasMoreLink ? 1 : 0);
}

/**
 * Distribute label groups across 3 columns using a greedy algorithm
 * to balance the total weight (visual height) of each column.
 *
 * Algorithm:
 * 1. Start with 3 empty columns
 * 2. For each label group (in order):
 *    - Calculate its weight based on expansion state
 *    - Add it to the column with the smallest current weight
 * 3. Return the balanced distribution
 */
function distributeLabelsAcrossColumns(
  labelGroups: LabelGroup[],
  expansionStates: Map<string, boolean>,
  maxInitial: number
): ColumnDistribution {
  const columns: [LabelGroup[], number][] = [
    [[], 0], // [items, totalWeight]
    [[], 0],
    [[], 0],
  ];

  // Greedy distribution: always add to the lightest column
  labelGroups.forEach((group) => {
    const isExpanded = expansionStates.get(group.label) ?? false;
    const weight = calculateLabelWeight(group, isExpanded, maxInitial);

    // Find column with minimum weight
    const minIndex = columns.reduce(
      (minIdx, col, idx, arr) => (col[1] < arr[minIdx][1] ? idx : minIdx),
      0
    );

    // Add to that column
    columns[minIndex][0].push(group);
    columns[minIndex][1] += weight;
  });

  return {
    column1: columns[0][0],
    column2: columns[1][0],
    column3: columns[2][0],
  };
}

/**
 * Renders a single label group with its categories.
 * Handles expand/collapse for labels with > maxInitial categories.
 */
function LabelGroupColumn({
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
    <div className="space-y-3">
      {/* Label Header with optional icon */}
      <div className="flex items-center gap-2 border-b pb-2">
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
 * Self-balancing 3-column category menu.
 *
 * Features:
 * - Distributes label groups across 3 columns to balance visual height
 * - Each label can show up to `maxInitialCategories` (default 7) before "...more"
 * - Clicking "...more" expands that label and rebalances all columns
 * - Clicking "...less" collapses that label and rebalances again
 *
 * Use cases: Header navigation, Footer navigation, Mobile menu
 */
export function CategoryMenuColumns({
  categoryGroups,
  labelIcons,
  maxInitialCategories = 7,
  className = "grid grid-cols-3 gap-x-6 gap-y-4",
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

  // Distribute labels across 3 columns (recalculates when expansion states change)
  const distribution = useMemo(
    () =>
      distributeLabelsAcrossColumns(
        labelGroups,
        expandedLabels,
        maxInitialCategories
      ),
    [labelGroups, expandedLabels, maxInitialCategories]
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
      {/* Column 1 */}
      <div className="space-y-6">
        {distribution.column1.map((group) => (
          <LabelGroupColumn
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

      {/* Column 2 */}
      <div className="space-y-6">
        {distribution.column2.map((group) => (
          <LabelGroupColumn
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

      {/* Column 3 */}
      <div className="space-y-6">
        {distribution.column3.map((group) => (
          <LabelGroupColumn
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
    </div>
  );
}
