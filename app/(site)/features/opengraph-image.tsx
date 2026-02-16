import { ImageResponse } from "next/og";

import { OG_SIZE, renderOgLayout, loadOgFonts } from "../../_og/og-layout";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Artisan Roast Features — Built for Specialty Coffee";

export default async function Image() {
  const fonts = await loadOgFonts();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://artisanroast.app";

  return new ImageResponse(
    await renderOgLayout({
      title: "Built for Specialty Coffee.",
      subtitle: "Powered by Modern Tech.",
      badge: isDemoMode ? "LIVE DEMO" : undefined,
      siteUrl: appUrl,
    }),
    { ...size, fonts }
  );
}
