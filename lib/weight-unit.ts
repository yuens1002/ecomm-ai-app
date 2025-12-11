// Shared weight unit enum for client/server-safe usage (string literals)
export enum WeightUnitOption {
  METRIC = "METRIC",
  IMPERIAL = "IMPERIAL",
}

export const isWeightUnitOption = (value: unknown): value is WeightUnitOption =>
  value === WeightUnitOption.METRIC || value === WeightUnitOption.IMPERIAL;

export const GRAMS_PER_OUNCE = 28.3495;

export const toGrams = (value: number, unit: WeightUnitOption): number =>
  unit === WeightUnitOption.IMPERIAL ? value * GRAMS_PER_OUNCE : value;

export const fromGrams = (grams: number, unit: WeightUnitOption): number =>
  unit === WeightUnitOption.IMPERIAL ? grams / GRAMS_PER_OUNCE : grams;

export const roundToInt = (value: number) => Math.round(value);
