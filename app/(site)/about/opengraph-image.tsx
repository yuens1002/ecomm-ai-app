import { ImageResponse } from "next/og";

import { getSiteMetadata } from "@/lib/site-metadata";

import { OG_SIZE, renderOgLayout } from "../../_og/og-layout";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "About Artisan Roast";

export default async function Image() {
  const { storeName } = await getSiteMetadata();

  return new ImageResponse(
    await renderOgLayout({
      title: `About ${storeName}`,
      subtitle: "Full-stack e-commerce for specialty coffee",
    }),
    { ...size }
  );
}
