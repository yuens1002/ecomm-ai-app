export type ColumnWidthPreset = Record<
  string,
  {
    head?: string;
    cell?: string;
  }
>;

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
      head: "w-56 min-w-56 md:w-72 md:min-w-72 px-6",
      cell: "w-56 min-w-56 md:w-72 md:min-w-72 pr-6",
    },
    labels: {
      head: "w-56 min-w-36 pr-6",
      cell: "w-56 pr-6 min-w-36",
    },
    products: {
      head: "w-36 px-4",
      cell: "px-4, text-center",
    },
    addedDate: {
      head: "w-48 px-8",
      cell: "px-8",
    },
    // Override base visibility to be explicit for this view.
    visibility: {
      head: "min-w-24 px-6",
      cell: "pr-8",
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
    },
    // Drag handle: 48px
    dragHandle: {
      head: "w-12 min-w-12 max-w-12 pr-2",
      cell: "pr-2",
    },
  }
);

export const categoryViewWidthPreset: ColumnWidthPreset = extendWidthPreset(
  baseMenuBuilderWidthPreset,
  {
    // Products (name) column: sortable, fixed width
    name: {
      head: "w-56 min-w-56 md:w-72 md:min-w-72 pr-6",
      cell: "w-56 min-w-56 md:w-72 md:min-w-72 pr-6",
    },
    // Added Order column: sortable
    addedOrder: {
      head: "w-40 pr-6 text-center",
      cell: "pr-14 text-center",
    },
    // Visibility column: eye icon, centered
    visibility: {
      head: "w-24 min-w-24 max-w-24 px-4 text-center",
      cell: "pr-6",
    },
    // Categories column: takes remaining space
    categories: {
      head: "pr-6",
      cell: "pr-6 min-w-48",
    },
    // Drag handle: 48px
    dragHandle: {
      head: "w-12 min-w-12 max-w-12 pr-2",
      cell: "pr-2",
    },
  }
);
