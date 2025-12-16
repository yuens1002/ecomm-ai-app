"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CarouselDots } from "./CarouselDots";

interface ProductImageGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  className?: string;
  aspectClass?: string; // e.g., "pb-[100%]" for square
  fallbackUrl?: string;
  fallbackAlt?: string;
}

// Lightweight gallery with clickable thumbnails and a sliding main image.
export function ProductImageGallery({
  images,
  className,
  aspectClass = "pb-[100%]",
  fallbackUrl = "https://placehold.co/600x600/CCCCCC/FFFFFF.png?text=Image+Not+Found",
  fallbackAlt = "Product image",
}: ProductImageGalleryProps) {
  const safeImages = useMemo(
    () => (images && images.length > 0 ? images : [{ url: fallbackUrl, alt: fallbackAlt }]),
    [images, fallbackAlt, fallbackUrl]
  );

  const [active, setActive] = useState(0);

  return (
    <div className={cn("flex flex-col gap-4 md:flex-row", className)}>
      {safeImages.length > 1 && (
        <div className="flex w-16 flex-row md:flex-col gap-2 overflow-auto pr-1 md:pr-0 md:overflow-y-auto md:h-full">
          {safeImages.map((img, idx) => (
            <button
              key={img.url + idx}
              type="button"
              onClick={() => setActive(idx)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border transition",
                active === idx ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt || fallbackAlt}
                fill
                className="object-cover object-left-top"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      <div className={cn("relative w-full overflow-hidden rounded-lg h-0", aspectClass)}>
        <div
          className="flex h-full w-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {safeImages.map((img, idx) => (
            <div
              key={img.url + idx}
              className="relative h-0 w-full pb-[100%] shrink-0 grow-0 basis-full"
            >
              <Image
                src={img.url}
                alt={img.alt || fallbackAlt}
                fill
                className="object-cover object-left-top"
                sizes="(max-width: 768px) 90vw, 45vw"
                priority={idx === 0}
              />
            </div>
          ))}
        </div>
        {safeImages.length > 1 && (
          <CarouselDots
            total={safeImages.length}
            currentIndex={active}
            onDotClick={setActive}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          />
        )}
      </div>
    </div>
  );
}
