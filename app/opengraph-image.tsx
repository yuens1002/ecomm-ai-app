import { ImageResponse } from "next/og";

import { getSiteMetadata } from "@/lib/site-metadata";

import { OG_SIZE, renderOgLayout } from "./_og/og-layout";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Artisan Roast — Specialty Coffee E-Commerce";

export default async function Image() {
  const { storeName, storeTagline } = await getSiteMetadata();

  return new ImageResponse(
    await renderOgLayout({ title: storeName, subtitle: storeTagline }),
    { ...size }
  );
}
