/** @jest-environment jsdom */

jest.mock("swr");

import useSWR from "swr";
import {
  useProductMenuData,
  PRODUCT_MENU_DATA_KEY,
} from "../useProductMenuData";
import { productMenuDataSchema } from "../../types/menu";

type SwrMockReturn<T> = {
  data?: T;
  error?: Error;
  isLoading: boolean;
  isValidating: boolean;
  mutate: jest.Mock;
};

const mockedUseSWR = useSWR as unknown as jest.Mock;

describe("useProductMenuData", () => {
  beforeEach(() => {
    mockedUseSWR.mockReset();
  });

  it("normalizes settings and maps text to title when data is present", () => {
    const mockData = productMenuDataSchema.parse({
      labels: [],
      categories: [],
      settings: { icon: "Coffee", text: "Shop" },
    });

    mockedUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } satisfies SwrMockReturn<typeof mockData>);

    const result = useProductMenuData();

    expect(mockedUseSWR).toHaveBeenCalledWith(
      PRODUCT_MENU_DATA_KEY,
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      })
    );
    expect(result.settings).toEqual({ icon: "Coffee", title: "Shop" });
    expect(result.labels).toEqual([]);
    expect(result.categories).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it("applies defaults for icon and title when settings are missing values", () => {
    const mockData = productMenuDataSchema.parse({
      labels: [],
      categories: [],
      settings: { icon: undefined, text: "Menu" },
    });

    mockedUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } satisfies SwrMockReturn<typeof mockData>);

    const result = useProductMenuData();

    expect(result.settings).toEqual({ icon: "", title: "Menu" });
  });

  it("returns undefined settings when data is not yet loaded", () => {
    mockedUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: jest.fn(),
    } satisfies SwrMockReturn<undefined>);

    const result = useProductMenuData();

    expect(result.settings).toBeUndefined();
    expect(result.labels).toEqual([]);
    expect(result.categories).toEqual([]);
    expect(result.isLoading).toBe(true);
  });

  it("returns labels with correct IDs and structure", () => {
    const mockData = productMenuDataSchema.parse({
      labels: [
        {
          id: "label-1",
          name: "Light Roasts",
          icon: "Leaf",
          order: 1,
          isVisible: true,
          autoOrder: false,
          categories: [
            { id: "cat-1", name: "Ethiopian", slug: "ethiopian", order: 1 },
            { id: "cat-2", name: "Kenyan", slug: "kenyan", order: 2 },
          ],
        },
        {
          id: "label-2",
          name: "Dark Roasts",
          icon: "Flame",
          order: 2,
          isVisible: true,
          autoOrder: true,
          categories: [
            { id: "cat-3", name: "French", slug: "french", order: 1 },
          ],
        },
      ],
      categories: [],
      settings: { icon: "Coffee", text: "Shop" },
    });

    mockedUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } satisfies SwrMockReturn<typeof mockData>);

    const result = useProductMenuData();

    expect(result.labels).toHaveLength(2);
    expect(result.labels[0]).toMatchObject({
      id: "label-1",
      name: "Light Roasts",
      icon: "Leaf",
      order: 1,
    });
    expect(result.labels[0].categories).toHaveLength(2);
    expect(result.labels[0].categories[0].id).toBe("cat-1");
    expect(result.labels[1].id).toBe("label-2");
  });

  it("returns categories with correct IDs and label associations", () => {
    const mockData = productMenuDataSchema.parse({
      labels: [],
      categories: [
        {
          id: "cat-1",
          name: "Espresso",
          slug: "espresso",
          order: 1,
          isVisible: true,
          productCount: 5,
          labels: [
            { id: "label-1", name: "By Roast", icon: "Flame", order: 1 },
            { id: "label-2", name: "By Origin", icon: "Globe", order: 2 },
          ],
        },
        {
          id: "cat-2",
          name: "Filter",
          slug: "filter",
          order: 2,
          isVisible: true,
          productCount: 8,
          labels: [
            { id: "label-1", name: "By Roast", icon: "Flame", order: 1 },
          ],
        },
      ],
      settings: { icon: "Mug", text: "Menu" },
    });

    mockedUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } satisfies SwrMockReturn<typeof mockData>);

    const result = useProductMenuData();

    expect(result.categories).toHaveLength(2);
    expect(result.categories[0]).toMatchObject({
      id: "cat-1",
      name: "Espresso",
      slug: "espresso",
      productCount: 5,
    });
    expect(result.categories[0].labels).toHaveLength(2);
    expect(result.categories[0].labels[0].id).toBe("label-1");
    expect(result.categories[1].id).toBe("cat-2");
    expect(result.categories[1].labels).toHaveLength(1);
  });

  it("preserves empty labels and categories arrays when provided", () => {
    const mockData = productMenuDataSchema.parse({
      labels: [],
      categories: [],
      settings: { icon: "Bag", text: "Shop" },
    });

    mockedUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } satisfies SwrMockReturn<typeof mockData>);

    const result = useProductMenuData();

    expect(result.labels).toEqual([]);
    expect(result.categories).toEqual([]);
  });

  it("handles error state without crashing", () => {
    const testError = new Error("Failed to load data");

    mockedUseSWR.mockReturnValue({
      data: undefined,
      error: testError,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } satisfies SwrMockReturn<undefined>);

    const result = useProductMenuData();

    expect(result.error).toBe(testError);
    expect(result.labels).toEqual([]);
    expect(result.categories).toEqual([]);
    expect(result.settings).toBeUndefined();
  });

  it("returns data with both labels and categories populated", () => {
    const mockData = productMenuDataSchema.parse({
      labels: [
        {
          id: "label-1",
          name: "By Roast",
          icon: "Flame",
          order: 1,
          isVisible: true,
          autoOrder: false,
          categories: [{ id: "cat-1", name: "Light", slug: "light", order: 1 }],
        },
      ],
      categories: [
        {
          id: "cat-1",
          name: "Light",
          slug: "light",
          order: 1,
          isVisible: true,
          productCount: 3,
          labels: [
            { id: "label-1", name: "By Roast", icon: "Flame", order: 1 },
          ],
        },
      ],
      settings: { icon: "Coffee", text: "Shop" },
    });

    mockedUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } satisfies SwrMockReturn<typeof mockData>);

    const result = useProductMenuData();

    expect(result.labels).toHaveLength(1);
    expect(result.categories).toHaveLength(1);
    expect(result.labels[0].id).toBe("label-1");
    expect(result.categories[0].id).toBe("cat-1");
    expect(result.settings).toEqual({ icon: "Coffee", title: "Shop" });
  });
});
