/**
 * App Settings Utilities
 * Manages global app configuration using SiteSettings key-value store
 */

import { prisma } from "./prisma";
import { LocationType } from "./location-type";

const APP_SETTINGS_KEYS = {
  LOCATION_TYPE: "app.locationType",
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
 * Get all app settings
 */
export async function getAppSettings() {
  const locationType = await getLocationType();

  return {
    locationType,
  };
}
