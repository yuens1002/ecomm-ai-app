import { ImageResponse } from "next/og";

import { OG_SIZE, renderOgLayout } from "../../_og/og-layout";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Artisan Roast Features — Built for Specialty Coffee";

export default async function Image() {
  return new ImageResponse(
    await renderOgLayout({
      title: "Built for Specialty Coffee.",
      subtitle: "Powered by Modern Tech.",
    }),
    { ...size }
  );
}
