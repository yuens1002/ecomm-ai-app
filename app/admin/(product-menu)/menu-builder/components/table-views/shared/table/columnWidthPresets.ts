export type ColumnWidthPreset = Record<
  string,
  {
    head?: string;
    cell?: string;
  }
>;

// 25% smaller than w-12 (48px) => w-9 (36px)
export const allCategoriesWidthPreset: ColumnWidthPreset = {
  select: {
    head: "w-9 min-w-9 max-w-9 p-0 pl-2.5 pr-0",
    cell: "w-9 min-w-9 max-w-9 p-0 pl-2.5 pr-0",
  },
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
  visibility: {
    head: "min-w-24 pr-6",
    cell: "pr-6",
  },
};
