import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { defaultSettings } from "@/lib/site-settings";

export const getSiteMetadata = cache(async function getSiteMetadata() {
  const settings = await prisma.siteSettings.findMany({
    where: {
      key: {
        in: [
          "store_name",
          "store_tagline",
          "store_description",
          "store_logo_url",
          "store_favicon_url",
        ],
      },
    },
  });

  const settingsMap = settings.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    },
    {} as Record<string, string>
  );

  return {
    storeName: settingsMap.store_name || defaultSettings.storeName,
    storeTagline: settingsMap.store_tagline || "",
    storeDescription: settingsMap.store_description || "",
    storeLogoUrl: settingsMap.store_logo_url || "/logo.svg",
    storeFaviconUrl: settingsMap.store_favicon_url || "/favicon.ico",
  };
});
