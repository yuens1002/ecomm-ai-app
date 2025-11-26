import { prisma } from "@/lib/prisma";

export async function getSiteMetadata() {
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
    storeName: settingsMap.store_name || "Artisan Roast",
    storeTagline:
      settingsMap.store_tagline ||
      "Specialty coffee sourced from the world's finest origins.",
    storeDescription:
      settingsMap.store_description ||
      "Premium specialty coffee, carefully roasted to perfection. From single-origin beans to signature blends, discover exceptional coffee delivered to your door.",
    storeLogoUrl: settingsMap.store_logo_url || "/logo.svg",
    storeFaviconUrl: settingsMap.store_favicon_url || "/favicon.ico",
  };
}
