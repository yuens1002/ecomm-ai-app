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
      head: "w-56 min-w-56 md:w-72 md:min-w-72 pl-6 pr-6",
      cell: "w-56 min-w-56 md:w-72 md:min-w-72 pr-6",
    },
    labels: {
      head: "max-w-xs min-w-56 pr-6",
      cell: "pr-6",
    },
    products: {
      head: "min-w-24 pr-6",
      cell: "pr-6",
    },
    // Override base visibility to be explicit for this view.
    visibility: {
      head: "min-w-24 pr-6",
      cell: "pr-6",
    },
  }
);
