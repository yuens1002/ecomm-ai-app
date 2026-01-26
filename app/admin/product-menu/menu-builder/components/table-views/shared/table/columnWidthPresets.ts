export type ColumnWidthEntry = {
  head?: string;
  cell?: string;
  /** Single source of truth for column alignment (applies to both header and cell) */
  align?: "left" | "center" | "right";
};

export type ColumnWidthPreset = Record<string, ColumnWidthEntry>;

export function extendWidthPreset(
  base: ColumnWidthPreset,
  overrides: ColumnWidthPreset
): ColumnWidthPreset {
  const merged: ColumnWidthPreset = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    merged[key] = {
      ...(base[key] ?? {}),
      ...value,
    };
  }

  return merged;
}

export const baseMenuBuilderWidthPreset: ColumnWidthPreset = {
  // Compact checkbox column
  select: {
    head: "w-9 min-w-9 max-w-9 p-0 pl-2.5 pr-0",
    cell: "w-9 min-w-9 max-w-9 p-0 pl-2.5 pr-0",
  },
  // Common tail padding for right-side columns
  visibility: {
    head: "min-w-24 pr-6",
    cell: "pr-6",
  },
};

export const allCategoriesWidthPreset: ColumnWidthPreset = extendWidthPreset(
  baseMenuBuilderWidthPreset,
  {
    name: {
      head: "w-90 min-w-36 px-6",
      cell: "w-90 min-w-36 pr-6",
    },
    products: {
      head: "w-24 min-w-24 px-4",
      cell: "w-24 min-w-24 px-4",
      align: "center",
    },
    addedDate: {
      head: "w-36 min-w-32 px-4",
      cell: "w-36 min-w-32 px-4",
      align: "center",
    },
    visibility: {
      head: "w-24 min-w-24 px-4",
      cell: "w-24 min-w-24 px-4",
      align: "center",
    },
    // Labels column: last column, takes remaining space
    labels: {
      head: "pr-6",
      cell: "pr-6 min-w-48",
    },
  }
);

export const allLabelsWidthPreset: ColumnWidthPreset = extendWidthPreset(
  baseMenuBuilderWidthPreset,
  {
    // Icon column: 48px, center aligned
    icon: {
      head: "w-16",
      cell: "w-16",
      align: "center",
    },
    // Name column: fixed width
    name: {
      head: "w-48 min-w-48 md:w-56 md:min-w-56 px-6",
      cell: "w-48 min-w-48 md:w-56 md:min-w-56",
    },
    // Categories column: no width set, takes remaining space in table-fixed
    categories: {
      head: "pr-6",
      cell: "pr-6 min-w-56",
    },
    // Visibility column: width to fit "Visibility" text + padding
    visibility: {
      head: "w-28 min-w-28 max-w-28 px-6",
      cell: "px-6",
      align: "center",
    },
    // Drag handle: 48px
    dragHandle: {
      head: "w-12 min-w-12 max-w-12 pr-2",
      cell: "pr-2",
      align: "center",
    },
  }
);

export const categoryViewWidthPreset: ColumnWidthPreset = extendWidthPreset(
  baseMenuBuilderWidthPreset,
  {
    // Products (name) column: sortable, fixed width
    name: {
      head: "w-80 min-w-40 pr-6",
      cell: "w-80 min-w-40 pr-6",
    },
    // Added Order column: sortable, centered
    addedOrder: {
      head: "w-36 px-6",
      cell: "px-6",
      align: "center",
    },
    // Visibility column: eye icon, centered
    visibility: {
      head: "w-30 min-w-30 max-w-30 px-6",
      cell: "w-30 min-w-30 max-w-30 px-6",
      align: "center",
    },
    // Categories column: takes remaining space
    categories: {
      head: "pr-6",
      cell: "pr-6",
    },
    // Drag handle: 48px
    dragHandle: {
      head: "w-12 min-w-12 max-w-12 pr-2",
      cell: "pr-2",
      align: "center",
    },
  }
);

export const menuViewWidthPreset: ColumnWidthPreset = extendWidthPreset(
  baseMenuBuilderWidthPreset,
  {
    // Name column: takes remaining space (no fixed width)
    // Contains inline checkbox + hierarchical content with depth-based indentation
    name: {
      head: "pl-2.5 pr-6",
      cell: "pl-2.5 pr-6 min-w-48",
    },
    // Categories count column: shown only for labels, centered
    categories: {
      head: "w-28 min-w-28 px-4",
      cell: "w-28 min-w-28 px-4",
      align: "center",
    },
    // Products count column: shown for labels and categories, centered
    products: {
      head: "w-28 min-w-28 px-4",
      cell: "w-28 min-w-28 px-4",
      align: "center",
    },
    // Visibility column: eye icon, centered
    visibility: {
      head: "w-28 min-w-28 px-4",
      cell: "w-28 min-w-28 px-4",
      align: "center",
    },
    // Drag handle: 48px
    dragHandle: {
      head: "w-12 min-w-12 max-w-12 pr-2",
      cell: "pr-2",
      align: "center",
    },
  }
);

export const labelViewWidthPreset: ColumnWidthPreset = extendWidthPreset(
  baseMenuBuilderWidthPreset,
  {
    // Category name column: sortable, fixed width
    name: {
      head: "w-48 min-w-48 md:w-56 md:min-w-56 pr-6",
      cell: "w-48 min-w-48 md:w-56 md:min-w-56 pr-6",
    },
    // Added Order column: sortable, centered
    addedOrder: {
      head: "w-40 px-6",
      cell: "px-6",
      align: "center",
    },
    // Products column: comma-separated list, takes remaining space
    products: {
      head: "pr-6",
      cell: "pr-6 min-w-48",
    },
    // Visibility column: eye icon, centered
    visibility: {
      head: "w-30 min-w-24 px-6",
      cell: "w-30 min-w-24 px-6",
      align: "center",
    },
    // Drag handle: 48px
    dragHandle: {
      head: "w-12 min-w-12 max-w-12 pr-2",
      cell: "pr-2",
      align: "center",
    },
  }
);
