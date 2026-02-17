/**
 * App Settings Utilities
 * Manages global app configuration using SiteSettings key-value store
 */

import { WeightUnit } from "@prisma/client";
import { prisma } from "../prisma";
import { LocationType } from "../location-type";

const APP_SETTINGS_KEYS = {
  LOCATION_TYPE: "app.locationType",
  WEIGHT_UNIT: "app.weightUnit",
  ALLOW_PROMO_CODES: "commerce.allowPromoCodes",
} as const;

/**
 * Get the cafe location type setting
 * @returns "SINGLE" or "MULTI"
 */
export async function getLocationType(): Promise<LocationType> {
  const setting = await prisma.siteSettings.findUnique({
    where: { key: APP_SETTINGS_KEYS.LOCATION_TYPE },
  });

  return (setting?.value as LocationType) || LocationType.SINGLE; // Default to SINGLE
}

/**
 * Get the preferred weight unit
 * @returns WeightUnit.METRIC or WeightUnit.IMPERIAL
 */
export async function getWeightUnit(): Promise<WeightUnit> {
  const setting = await prisma.siteSettings.findUnique({
    where: { key: APP_SETTINGS_KEYS.WEIGHT_UNIT },
  });

  if (setting?.value === WeightUnit.IMPERIAL) return WeightUnit.IMPERIAL;
  return WeightUnit.METRIC;
}

/**
 * Set the cafe location type setting
 * @param value "SINGLE" or "MULTI"
 */
export async function setLocationType(value: LocationType): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: APP_SETTINGS_KEYS.LOCATION_TYPE },
    update: { value },
    create: {
      key: APP_SETTINGS_KEYS.LOCATION_TYPE,
      value,
    },
  });
}

/**
 * Set the preferred weight unit
 */
export async function setWeightUnit(value: WeightUnit): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: APP_SETTINGS_KEYS.WEIGHT_UNIT },
    update: { value },
    create: {
      key: APP_SETTINGS_KEYS.WEIGHT_UNIT,
      value,
    },
  });
}

/**
 * Get whether promotion codes are enabled at checkout
 */
export async function getAllowPromoCodes(): Promise<boolean> {
  const setting = await prisma.siteSettings.findUnique({
    where: { key: APP_SETTINGS_KEYS.ALLOW_PROMO_CODES },
  });

  return setting?.value === "true";
}

/**
 * Set whether promotion codes are enabled at checkout
 */
export async function setAllowPromoCodes(value: boolean): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: APP_SETTINGS_KEYS.ALLOW_PROMO_CODES },
    update: { value: String(value) },
    create: {
      key: APP_SETTINGS_KEYS.ALLOW_PROMO_CODES,
      value: String(value),
    },
  });
}

/**
 * Get all app settings
 */
export async function getAppSettings() {
  const locationType = await getLocationType();
  const weightUnit = await getWeightUnit();

  return {
    locationType,
    weightUnit,
  };
}
