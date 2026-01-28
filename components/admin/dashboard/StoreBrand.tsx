"use client";

import Image from "next/image";

interface StoreBrandProps {
  storeName: string;
  storeLogoUrl?: string;
  className?: string;
}

/**
 * Store branding component - displays logo or store name
 * Used in top nav (desktop & mobile) and mobile drawer
 */
export function StoreBrand({ storeName, storeLogoUrl, className }: StoreBrandProps) {
  if (storeLogoUrl) {
    return (
      <Image
        src={storeLogoUrl}
        alt={storeName}
        width={32}
        height={32}
        className={className ?? "h-8 w-8 object-contain"}
      />
    );
  }

  return (
    <span className={className ?? "font-semibold text-lg"}>
      {storeName}
    </span>
  );
}
