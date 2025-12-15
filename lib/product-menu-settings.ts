import { prisma } from "@/lib/prisma";

/**
 * Get product menu icon and text settings for header navigation
 * Returns defaults if settings don't exist
 */
export async function getProductMenuSettings() {
  const settings = await prisma.siteSettings.findMany({
    where: {
      key: {
        in: ["product_menu_icon", "product_menu_text"],
      },
    },
  });

  const settingsMap = settings.reduce(
    (acc, setting) => {
      if (setting.key === "product_menu_icon") {
        acc.icon = setting.value;
      } else if (setting.key === "product_menu_text") {
        acc.text = setting.value;
      }
      return acc;
    },
    { icon: "ShoppingBag", text: "Shop" } as { icon: string; text: string }
  );

  return settingsMap;
}
